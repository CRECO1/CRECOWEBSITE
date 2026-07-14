import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CRECO_SYSTEM_PROMPT } from '@/lib/chat-system-prompt';
import { CHAT_TOOLS, executeChatTool } from '@/lib/chat-tools';
import { clampString } from '@/lib/sanitize';

/**
 * Chat endpoint backing the on-site chatbot.
 *
 * Streams responses from Claude back to the browser as plain text. The
 * frontend reads the stream chunk-by-chunk and renders it as it arrives.
 *
 * Cost shape:
 *   - Model: Haiku 4.5 ($1/$5 per 1M input/output tokens)
 *   - System prompt: ~5K tokens, cached via prompt caching → ~0.1× input
 *     price on every read after the first within the 5-min TTL window
 *   - Conversation: capped at MAX_TURNS so stale tabs can't grow unbounded
 *
 * To upgrade quality, flip MODEL to 'claude-sonnet-4-6'. Single-line change.
 *
 * Defenses:
 *   - Validates message shape and roles
 *   - Clamps each message to MAX_INPUT_LEN to bound a single-message DoS
 *   - Caps conversation length at MAX_TURNS
 *   - Returns 503 if ANTHROPIC_API_KEY is unset (fail-clean, not 500)
 *   - In-memory per-IP rate limit (best-effort; Vercel functions are
 *     stateless across invocations, so this is a soft cap)
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Flip to 'claude-sonnet-4-6' to upgrade quality at ~3× input / ~3× output cost.
const MODEL = 'claude-haiku-4-5';
const MAX_TURNS = 30;
const MAX_INPUT_LEN = 4000;
const MAX_OUTPUT_TOKENS = 1024;

// Best-effort in-memory rate limit — survives within a warm Vercel function
// instance, resets on cold start. For a hard guarantee we'd back this with
// Upstash Redis, but for a chatbot the honeypot + Anthropic's own rate
// limits + sane MAX_TURNS already cover the realistic threats.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 20;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_MAX_REQUESTS) return false;
  bucket.count += 1;
  return true;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Chat is not configured yet. Call (210) 817-3443.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Crude IP detection — Vercel sets x-forwarded-for; first hop is the client
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (!checkRate(ip)) {
    return new Response(
      JSON.stringify({ error: "You're sending messages a little fast — try again in a minute." }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response('Missing messages', { status: 400 });
  }
  if (body.messages.length > MAX_TURNS) {
    return new Response('Conversation too long. Refresh to start over.', { status: 400 });
  }

  // Validate, sanitize, clamp every message
  const messages: ChatMessage[] = [];
  for (const m of body.messages) {
    if (!m || typeof m !== 'object') continue;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') continue;
    const safe = clampString(content, MAX_INPUT_LEN);
    if (!safe) continue;
    messages.push({ role, content: safe });
  }

  if (messages.length === 0 || messages[0].role !== 'user') {
    return new Response('First message must be from user', { status: 400 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const encoder = new TextEncoder();
  // Agent loop cap — hard limit on how many tool_use→tool_result cycles
  // one visitor turn can chain. Prevents a runaway prompt from
  // triggering many sequential tool calls. In practice a normal
  // visitor turn resolves in 1-2 iterations (one search + one reply,
  // or one search + capture_lead + reply). 6 gives generous headroom.
  const MAX_ITERATIONS = 6;

  const readable = new ReadableStream({
    async start(controller) {
      // Working conversation — grows with each turn's assistant message
      // and any tool_result blocks so Claude sees the full history when
      // it decides its next action.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conversation: any[] = [...messages];
      let currentStream: ReturnType<typeof client.messages.stream> | null = null;

      try {
        for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
          // Only cache_control the FIRST request in the loop — subsequent
          // iterations reuse the cached prefix but the conversation array
          // has grown, so the prefix is what caches, not the full request.
          currentStream = client.messages.stream({
            model: MODEL,
            max_tokens: MAX_OUTPUT_TOKENS,
            system: [
              {
                type: 'text',
                text: CRECO_SYSTEM_PROMPT,
                cache_control: { type: 'ephemeral' },
              },
            ],
            tools: CHAT_TOOLS,
            messages: conversation,
          });

          // Stream visible text tokens to the browser as they arrive.
          // tool_use blocks stream too (as content_block_start/stop) but
          // don't emit user-visible text — those are handled after the
          // stream by inspecting the finalMessage.
          for await (const event of currentStream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }

          const message = await currentStream.finalMessage();
          conversation.push({ role: 'assistant', content: message.content });

          // If Claude stopped without using a tool, we're done.
          if (message.stop_reason !== 'tool_use') break;

          // Execute every tool_use block in the turn, in order.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const toolResults: any[] = [];
          for (const block of message.content) {
            if (block.type === 'tool_use') {
              try {
                const result = await executeChatTool(block.name, block.input);
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: block.id,
                  content: JSON.stringify(result),
                });
              } catch (err) {
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: block.id,
                  content: JSON.stringify({
                    error: err instanceof Error ? err.message : 'Tool execution failed',
                  }),
                  is_error: true,
                });
              }
            }
          }
          conversation.push({ role: 'user', content: toolResults });
          // Loop iterates — Claude will read the tool_result and continue
        }
        controller.close();
      } catch (err) {
        // Surface a graceful in-stream error rather than a hard fetch failure
        // User-facing message stays generic — the actual error detail
        // is server-logged via console.error so Vercel logs / observability
        // has the full context. If we ever need to debug a specific
        // failure in production, check the Vercel function logs for
        // /api/chat rather than surfacing the raw Anthropic error to
        // the visitor (which briefly exposed billing state during a
        // credit-exhaustion incident on 2026-07-14).
        //
        // Special-case known operator-facing failures with a friendlier
        // message so a low-credit day doesn't render as "Chat is having
        // trouble (400)". If the account is unfunded, tell the visitor
        // to call rather than showing a technical status code.
        const status = err instanceof Anthropic.APIError ? err.status : 0;
        const rawMsg = err instanceof Error ? err.message : '';
        const isCreditIssue = rawMsg.toLowerCase().includes('credit balance');
        const isRateLimit = status === 429;
        const msg = isCreditIssue || isRateLimit
          ? "Chat is temporarily unavailable. Please call (210) 817-3443 or use the contact form and a CRECO principal will get right back to you."
          : status
            ? `Chat is having trouble (${status}). Try again, or call (210) 817-3443.`
            : 'Chat hit an error. Try again, or call (210) 817-3443.';
        try {
          controller.enqueue(encoder.encode(`\n\n[${msg}]`));
        } catch { /* controller may already be closed */ }
        controller.close();
        console.error('Chat stream error:', err);
      }
    },
    cancel() {
      // Abort the in-flight stream if the browser navigated away
      // (best-effort — the loop may already be between iterations)
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  });
}
