/**
 * Google reviews — real social proof, with the rating badge and a link out to
 * the profile so a visitor can check it rather than take our word for it.
 *
 * Server component: the quotes are in the prerendered HTML, so they are social
 * proof at paint and readable by crawlers, not injected after mount.
 *
 * Layout: the two substantive reviews take a two-column grid and carry the
 * section; the one-line review sits below as a full-width bar. Giving "Great
 * company." an equal third column left an obviously thin card next to two full
 * ones — as a wide quiet line underneath it reads as a closing note instead of
 * a gap. Below md everything stacks in source order.
 *
 * Deliberately no schema.org Review/AggregateRating markup here. Google's
 * guidelines don't allow a business to mark up reviews of itself on its own
 * site, and the profile already carries the real aggregate — emitting it would
 * risk a manual action on exactly the thing it's meant to promote.
 */

import { Star, ExternalLink } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/hooks/useScrollReveal';
import { REVIEWS, GOOGLE_RATING, GOOGLE_REVIEW_COUNT, GOOGLE_PROFILE_URL, type Review } from '@/lib/reviews';

function Stars({ rating, className = 'h-4 w-4' }: { rating: number; className?: string }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={`${className} ${i < rating ? 'fill-gold text-gold' : 'text-border'}`}
        />
      ))}
    </div>
  );
}

function Attribution({ review }: { review: Review }) {
  return (
    <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-5">
      <div>
        <p className="font-semibold text-primary">{review.name}</p>
        <p className="text-caption text-foreground-muted">
          {review.badge ? `${review.badge} · ` : ''}Review on {review.source}
        </p>
      </div>
      <Stars rating={review.rating} />
    </div>
  );
}

export function GoogleReviews({ className = 'section-luxury bg-background-cream' }: { className?: string }) {
  if (REVIEWS.length === 0) return null;

  // Long reviews lead; anything short enough to look thin in a card is
  // collected into the closing line. The threshold is about layout, not
  // importance — a future 40-word review joins the grid automatically.
  const featured = REVIEWS.filter(r => r.quote.length > 60);
  const brief = REVIEWS.filter(r => r.quote.length <= 60);

  return (
    <section className={className} aria-labelledby="google-reviews-heading">
      <Container>
        <RevealOnScroll>
          <div className="mb-12 text-center">
            <p className="overline mb-3">What Clients Say</p>
            <h2
              id="google-reviews-heading"
              className="font-heading text-display font-bold text-primary gold-line gold-line-center inline-block pb-4"
            >
              Reviewed by the people we work for
            </h2>

            {/* Rating badge — the number, then where it comes from. */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
              {/* max-w-full + flex-wrap: without them the badge's content sets a
                  min-content width wider than a 375px viewport, which overflows
                  the page and drags every other element off the right edge. */}
              <span className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-full border border-gold/30 bg-white px-4 py-2 shadow-sm">
                <span className="font-heading text-heading-sm font-bold text-primary">
                  {GOOGLE_RATING.toFixed(1)}
                </span>
                <Stars rating={5} />
                <span className="text-body-sm text-foreground-muted">
                  on Google · {GOOGLE_REVIEW_COUNT} reviews
                </span>
              </span>
              <a
                href={GOOGLE_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-gold-dark underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                Read our Google reviews
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </a>
            </div>
          </div>
        </RevealOnScroll>

        <div className={`grid grid-cols-1 gap-6 ${featured.length >= 2 ? 'md:grid-cols-2' : 'max-w-2xl mx-auto'}`}>
          {featured.map((review, i) => (
            <RevealOnScroll key={review.name} delay={i * 100}>
              <figure className="flex h-full flex-col rounded-xl bg-white p-7 shadow-card sm:p-8">
                <blockquote className="quote-luxury flex-1 text-foreground-muted">
                  {review.quote}
                </blockquote>
                <figcaption>
                  <Attribution review={review} />
                </figcaption>
              </figure>
            </RevealOnScroll>
          ))}
        </div>

        {brief.length > 0 && (
          <RevealOnScroll delay={featured.length * 100}>
            <div className="mt-6 grid grid-cols-1 gap-6">
              {brief.map(review => (
                <figure
                  key={review.name}
                  className="flex flex-col items-start gap-4 rounded-xl bg-white px-7 py-5 shadow-card sm:flex-row sm:items-center sm:justify-between sm:px-8"
                >
                  <blockquote className="font-heading text-heading-sm font-semibold italic text-primary">
                    &ldquo;{review.quote}&rdquo;
                  </blockquote>
                  <figcaption className="flex flex-wrap items-center gap-3">
                    <span className="text-body-sm font-semibold text-primary">{review.name}</span>
                    <Stars rating={review.rating} />
                  </figcaption>
                </figure>
              ))}
            </div>
          </RevealOnScroll>
        )}
      </Container>
    </section>
  );
}
