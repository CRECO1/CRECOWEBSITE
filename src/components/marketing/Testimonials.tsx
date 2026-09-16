/**
 * Reusable testimonials section — server component so the quotes are in the
 * prerendered HTML (social proof at paint + indexable), not fetched client-
 * side after mount. Reads the same featured `testimonials` the homepage does,
 * so all surfaces stay in sync from one source.
 *
 * Renders nothing when there are no featured testimonials (or the query
 * fails) — a proof section with zero cards is worse than no section, and we
 * never want to show placeholder/empty state on a money page.
 *
 * Card markup mirrors the homepage testimonials block intentionally, so the
 * design reads as one system across /, /sell, and /property-valuation.
 */

import { Star } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/hooks/useScrollReveal';
import { getTestimonials } from '@/lib/supabase';

interface TestimonialsProps {
  eyebrow?: string;
  heading?: string;
  /** Max cards to show. Featured testimonials, newest first. */
  max?: number;
  /** Section background utility class (must be a literal that exists in the build). */
  bg?: 'bg-background-cream' | 'bg-white';
}

export async function Testimonials({
  eyebrow = 'Client Stories',
  heading = 'What our clients say',
  max = 3,
  bg = 'bg-background-cream',
}: TestimonialsProps) {
  let items: Awaited<ReturnType<typeof getTestimonials>> = [];
  try {
    items = (await getTestimonials(true)).slice(0, max);
  } catch {
    return null;
  }
  if (items.length === 0) return null;

  // Center smaller sets so 1–2 real testimonials still look intentional
  // rather than stranded in a 3-wide grid.
  const gridCols =
    items.length >= 3 ? 'md:grid-cols-3'
    : items.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto'
    : 'max-w-2xl mx-auto';

  return (
    <section className={`section-luxury ${bg}`} aria-label="Client testimonials">
      <Container>
        <RevealOnScroll>
          <div className="mb-14 text-center">
            <p className="overline mb-3">{eyebrow}</p>
            <h2 className="font-heading text-display font-bold text-primary gold-line gold-line-center inline-block pb-4">
              {heading}
            </h2>
          </div>
        </RevealOnScroll>
        <div className={`grid grid-cols-1 gap-8 ${gridCols}`}>
          {items.map((t, i) => (
            <RevealOnScroll key={t.id} delay={i * 100}>
              <div className="rounded-xl bg-white p-8 shadow-card h-full flex flex-col">
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating ?? 5 }).map((_, j) => (
                    <Star key={j} className="h-5 w-5 fill-gold text-gold" />
                  ))}
                </div>
                <p className="quote-luxury flex-1 text-foreground-muted">{t.quote}</p>
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="font-semibold text-primary">{t.client_name}</p>
                  {t.client_location && (
                    <p className="text-caption text-foreground-muted">{t.client_location}</p>
                  )}
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </section>
  );
}
