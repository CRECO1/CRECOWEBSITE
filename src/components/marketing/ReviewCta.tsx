/**
 * "Leave a Google review" — a quiet ask, sized to match its weight.
 *
 * Deliberately one line rather than a card or a band: a review request on a
 * brokerage's homepage is for the handful of visitors who are already clients,
 * and it should be invisible to everyone else rather than competing with the
 * page's actual calls to action. It reads as a footnote under the reviews, not
 * as a pitch.
 *
 * Self-contained so it is easy to move or drop: it renders its own spacing and
 * takes nothing but an optional className. Removing it is deleting the single
 * <ReviewCta /> line wherever it is used; relocating it is moving that line.
 */

import { Star } from 'lucide-react';
import { GOOGLE_WRITE_REVIEW_URL } from '@/lib/reviews';

export function ReviewCta({ className = 'mt-10' }: { className?: string }) {
  return (
    <div className={`text-center ${className}`}>
      <p className="text-body-sm text-foreground-muted">
        Worked with us?{' '}
        <a
          href={GOOGLE_WRITE_REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-semibold text-gold-dark underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          <Star className="h-3.5 w-3.5 shrink-0 fill-gold text-gold" aria-hidden="true" />
          Leave a Google review
          <span aria-hidden="true">&rarr;</span>
        </a>
      </p>
    </div>
  );
}
