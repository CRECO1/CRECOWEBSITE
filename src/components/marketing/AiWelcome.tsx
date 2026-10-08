'use client';

import { useEffect, useState } from 'react';
import { aiSource } from '@/lib/tracker';
import { AI_WELCOME_LINE, RESPONSE_TIME_PROMISE } from '@/lib/hero-proof';

/**
 * One line of context for visitors who arrived from an AI assistant (ChatGPT, Perplexity, Claude, …) and
 * nothing for everyone else. Decided on the client after mount, so the static page is identical for all visitors.
 */
export function AiWelcome() {
  const [show, setShow] = useState(false);
  useEffect(() => { setShow(aiSource() !== ''); }, []);
  if (!show) return null;
  return (
    <p
      className="mx-auto -mt-4 mb-8 max-w-xl rounded-2xl border border-gold/40 bg-white/10 px-5 py-2 text-body-sm font-semibold text-white animate-fade-in"
      data-track-section="hero_ai_welcome"
    >
      {AI_WELCOME_LINE}
      {/* TODO(Zack): response-time promise goes in lib/hero-proof.ts (RESPONSE_TIME_PROMISE); it renders here. */}
      {RESPONSE_TIME_PROMISE ? ` ${RESPONSE_TIME_PROMISE}` : null}
    </p>
  );
}
