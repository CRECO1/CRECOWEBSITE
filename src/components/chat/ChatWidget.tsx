'use client';

/**
 * Floating chatbot for the CRECO website.
 *
 * Architecture:
 *   - Floating gold button bottom-right opens the panel
 *   - Panel is a fixed bottom-right card (desktop) / near-fullscreen sheet (mobile)
 *   - Conversation state lives in component state + localStorage so it
 *     survives page navigation and refresh
 *   - Sends message history to /api/chat which streams a plain-text response
 *     back via fetch + ReadableStream
 *   - Renders inline markdown links as clickable <a> elements (we don't
 *     pull in a markdown lib for this — the surface is intentionally narrow)
 *
 * UX choices:
 *   - We don't show typing dots forever. Once any token arrives, the
 *     assistant message starts rendering character-by-character.
 *   - We don't auto-open. The user opts in by clicking the bubble.
 *   - We don't persist across users / devices. localStorage only.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, X, Send, Sparkles, RefreshCw, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'creco-chat-history';
const STORAGE_OPEN_KEY = 'creco-chat-open';
const WELCOME_MESSAGE =
  "Hi — I'm CRECO's website assistant. I can answer questions about Texas commercial real estate, our services, the 8000 Fair Oaks Pkwy center we operate, current market conditions, or point you to the right page on the site. What can I help with?";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function readHistory(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is ChatMessage =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string',
    );
  } catch {
    return [];
  }
}

function writeHistory(messages: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch { /* quota errors */ }
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setMessages(readHistory());
    if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_OPEN_KEY) === '1') {
      setOpen(true);
    }
  }, []);

  // Persist messages
  useEffect(() => {
    writeHistory(messages);
  }, [messages]);

  // Persist open state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (open) localStorage.setItem(STORAGE_OPEN_KEY, '1');
    else localStorage.removeItem(STORAGE_OPEN_KEY);
  }, [open]);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streamedText, open]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && !streaming) {
      // Slight delay to let the panel finish mounting/animating
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open, streaming]);

  async function send(rawText: string) {
    const text = rawText.trim();
    if (!text || streaming) return;
    setError(null);

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setStreaming(true);
    setStreamedText('');

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) {
        // Try to surface a JSON error message if the route returned one
        let msg = `Chat unavailable (${res.status}).`;
        try {
          const body = await res.json();
          if (body && typeof body.error === 'string') msg = body.error;
        } catch { /* not JSON, fall through */ }
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        setStreamedText(buf);
      }
      // Final flush
      buf += decoder.decode();
      setStreamedText(buf);

      if (buf.trim()) {
        setMessages([...nextMessages, { role: 'assistant', content: buf }]);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // User stopped the stream — keep whatever we got so far
        if (streamedText.trim()) {
          setMessages([...nextMessages, { role: 'assistant', content: streamedText }]);
        }
      } else {
        setError((err as Error).message);
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
      setStreamedText('');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter inserts a newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function clear() {
    if (streaming) abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setStreamedText('');
    writeHistory([]);
  }

  // Bubble (closed state)
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open CRECO chat"
        className="fixed z-40 bottom-6 right-6 max-md:bottom-24 max-md:right-4 inline-flex items-center gap-2 rounded-full bg-primary text-white pl-3 pr-4 py-3 shadow-2xl border border-gold/40 hover:bg-primary/90 transition-colors"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold text-primary">
          <MessageCircle className="h-4 w-4" />
        </span>
        <span className="text-body-sm font-semibold">Ask CRECO</span>
      </button>
    );
  }

  // Render panel
  return (
    <div
      className="fixed z-50 bottom-6 right-6 max-md:bottom-0 max-md:right-0 max-md:left-0 max-md:top-16 flex flex-col w-[380px] h-[600px] max-md:w-auto max-md:h-auto rounded-2xl max-md:rounded-none bg-white shadow-2xl border border-border overflow-hidden"
      role="dialog"
      aria-label="CRECO chat"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-primary text-white">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-body-sm font-semibold leading-tight">CRECO Assistant</p>
            <p className="text-caption text-white/60 leading-tight">Texas CRE · ask anything</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clear}
              title="Clear conversation"
              aria-label="Clear conversation"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            title="Close chat"
            aria-label="Close chat"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background-cream">
        {messages.length === 0 && !streaming && (
          <Bubble role="assistant" content={WELCOME_MESSAGE} />
        )}
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
        {streaming && streamedText && <Bubble role="assistant" content={streamedText} streaming />}
        {streaming && !streamedText && (
          <div className="flex items-center gap-2 text-caption text-foreground-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
            <span>Thinking…</span>
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-body-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Suggested prompts when empty */}
      {messages.length === 0 && !streaming && (
        <div className="px-4 pb-3 bg-background-cream border-t border-border/50">
          <p className="text-caption uppercase tracking-widest text-foreground-muted mb-2">Try asking</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              'What does CRECO do?',
              'Tell me about 8000 Fair Oaks Pkwy',
              "What's a fair industrial rate in San Antonio?",
              'How does a 1031 exchange work?',
            ].map(q => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="text-caption px-2.5 py-1.5 rounded-full bg-white border border-border hover:border-gold hover:text-primary transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-border">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Texas commercial real estate…"
            rows={1}
            disabled={streaming}
            className="flex-1 resize-none rounded-lg border border-border bg-white px-3 py-2 text-body-sm text-primary placeholder:text-foreground-muted/60 focus:outline-none focus:border-gold disabled:opacity-60 max-h-32"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gold text-primary hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-caption text-foreground-muted">
          Replies are AI-generated. Time-sensitive? Call <a href="tel:+12108173443" className="text-gold-dark hover:underline">(210) 817-3443</a>.
        </p>
      </form>
    </div>
  );
}

/**
 * Renders one chat bubble. Linkifies in-text URL paths (/insights/foo) and
 * tel: links so users can navigate without copy/pasting.
 */
function Bubble({
  role,
  content,
  streaming = false,
}: {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-body-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-white text-primary border border-border rounded-bl-sm'
        }`}
      >
        {linkify(content)}
        {streaming && <span className="inline-block ml-0.5 w-1.5 h-4 bg-gold/70 align-middle animate-pulse" />}
      </div>
    </div>
  );
}

/**
 * Tiny URL/tel linkifier. We deliberately do not pull a markdown library —
 * the chatbot output surface is narrow and we'd rather keep the bundle
 * small. Recognizes:
 *   - Internal paths starting with "/" followed by [a-z0-9-/_.]
 *   - https:// and http:// URLs
 *   - tel: phone numbers
 *
 * Returns a React fragment of mixed strings and <a> / <Link> elements.
 */
function linkify(text: string): React.ReactNode {
  const pattern = /(https?:\/\/[^\s)]+|tel:\+?[\d-]+|(?<![A-Za-z0-9])\/[a-z0-9][a-z0-9\-/_]*[a-z0-9])/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const matched = match[0];
    if (matched.startsWith('/')) {
      parts.push(
        <Link key={key++} href={matched} className="text-gold-dark underline hover:text-gold">
          {matched}
        </Link>,
      );
    } else if (matched.startsWith('tel:')) {
      parts.push(
        <a key={key++} href={matched} className="text-gold-dark underline hover:text-gold">
          {matched.replace('tel:', '')}
        </a>,
      );
    } else {
      parts.push(
        <a
          key={key++}
          href={matched}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-dark underline hover:text-gold"
        >
          {matched}
        </a>,
      );
    }
    lastIndex = match.index + matched.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
