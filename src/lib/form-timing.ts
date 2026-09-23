/**
 * Minimum fill time — the cheapest bot signal after the honeypot.
 *
 * <Honeypot> stamps `form_rendered_at` when the form mounts. A person has to
 * read the field, type an address and click; that is seconds. A script posts
 * the moment it has parsed the DOM. Anything faster than MIN_FILL_MS is
 * treated the way the honeypot is treated — accepted to the caller, discarded
 * by us — so a bot learns nothing from the response.
 *
 * Deliberately forgiving. The threshold is low enough that a fast human with a
 * password-manager autofill still clears it, because the cost of blocking one
 * genuine enquiry is far higher than the cost of letting one bot through to
 * the layers behind this.
 *
 * The stamp is client-supplied and therefore forgeable. That is fine: this is
 * one layer of several, and forging it requires a bot that specifically knows
 * about the field, which is already a much smaller population.
 */

/** 2.5s — under a plausible human fill, over an instant scripted post. */
export const MIN_FILL_MS = 2500;

/** Absurdly old stamps mean a stale tab or a replayed payload. 12h. */
const MAX_FILL_MS = 12 * 60 * 60 * 1000;

export interface TimingVerdict {
  ok: boolean;
  elapsedMs: number | null;
  reason?: 'too-fast' | 'stale' | 'missing';
}

export function checkFormTiming(renderedAt: unknown, now = Date.now()): TimingVerdict {
  const stamp = typeof renderedAt === 'number' ? renderedAt : Number(renderedAt);

  // No stamp: an older cached bundle, or a form that predates this. Allow —
  // the honeypot and everything downstream still apply. Never fail a real
  // visitor because their HTML is a deploy behind.
  if (!renderedAt || !Number.isFinite(stamp) || stamp <= 0) {
    return { ok: true, elapsedMs: null, reason: 'missing' };
  }

  const elapsedMs = now - stamp;

  // Clock skew can make a client stamp land slightly in the future. Only a
  // wildly future stamp is suspicious, and it reads as forged rather than slow.
  if (elapsedMs < 0) {
    return { ok: elapsedMs > -60_000, elapsedMs, reason: 'too-fast' };
  }
  if (elapsedMs < MIN_FILL_MS) return { ok: false, elapsedMs, reason: 'too-fast' };
  if (elapsedMs > MAX_FILL_MS) return { ok: false, elapsedMs, reason: 'stale' };
  return { ok: true, elapsedMs };
}
