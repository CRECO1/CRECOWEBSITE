import { Star } from 'lucide-react';
import { PhoneCallText } from '@/components/marketing/PhoneCallText';
import { BUSINESS } from '@/lib/schema';
import { GOOGLE_RATING, GOOGLE_REVIEW_COUNT } from '@/lib/reviews';
import { HERO_MIN_REVIEWS_TO_SHOW_COUNT, SHOW_GOOGLE_RATING } from '@/lib/hero-proof';

/**
 * "Prefer to talk? Call or text (210) 817-3443 · Mon–Fri 8:00–5:30 · Licensed Texas brokerage"
 * — the hero's no-form option. The Google rating follows (lib/hero-proof.ts: SHOW_GOOGLE_RATING, and the count only
 * at HERO_MIN_REVIEWS_TO_SHOW_COUNT or more).
 */
export function HeroTalkLine() {
  return (
    <p
      className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-body-sm text-white/80 animate-fade-in delay-300 fill-both"
      data-track-section="hero_talk"
    >
      <span>Prefer to talk? Call or text</span>
      <PhoneCallText variant="inline" tone="dark" surface="homepage-hero" />
      <span aria-hidden="true" className="text-white/40">·</span>
      <span>{BUSINESS.hoursShort}</span>
      <span aria-hidden="true" className="text-white/40">·</span>
      <span>Licensed Texas brokerage</span>
      {SHOW_GOOGLE_RATING && (
        <>
          <span aria-hidden="true" className="text-white/40">·</span>
          <span className="inline-flex items-center gap-1">
            {GOOGLE_RATING.toFixed(1)}
            <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden="true" />
            on Google{GOOGLE_REVIEW_COUNT >= HERO_MIN_REVIEWS_TO_SHOW_COUNT ? ` (${GOOGLE_REVIEW_COUNT} reviews)` : ''}
          </span>
        </>
      )}
    </p>
  );
}
