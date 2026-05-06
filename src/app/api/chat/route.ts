import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CRECO_SYSTEM_PROMPT } from '@/lib/chat-system-prompt';
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

  // System prompt is sent as a single text block with cache_control so the
  // entire ~5K-token preamble reads at ~0.1× cost on subsequent requests
  // within the 5-min TTL window. The prefix must stay byte-stable — that
  // means no per-request interpolation into CRECO_SYSTEM_PROMPT.
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: [
      {
        type: 'text',
        text: CRECO_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        // Surface a graceful in-stream error rather than a hard fetch failure
        const msg = err instanceof Anthropic.APIError
          ? `Chat is having trouble (${err.status}). Try again, or call (210) 817-3443.`
          : 'Chat hit an error. Try again, or call (210) 817-3443.';
        try {
          controller.enqueue(encoder.encode(`\n\n[${msg}]`));
        } catch { /* controller may already be closed */ }
        controller.close();
        console.error('Chat stream error:', err);
      }
    },
    cancel() {
      stream.controller?.abort();
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
