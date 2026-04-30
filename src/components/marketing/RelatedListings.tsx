/**
 * Async server component that renders 3-6 "more available properties" cards
 * alongside a feature listing detail page. Smart prioritization:
 *   1. Same property_type, same submarket — most relevant
 *   2. Same property_type, any submarket
 *   3. Same submarket, any property_type
 *   4. Any active listing (newest first)
 *
 * Used on /listings/[slug] as the cross-sell. Fetches its own data so the
 * caller just renders <RelatedListings currentSlug={...} ... />.
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { getListings, type Listing } from '@/lib/supabase';
import { PropertyCard } from './PropertyCard';

interface Props {
  /** Slug of the listing currently being shown — excluded from results */
  currentSlug: string;
  /** Used for relevance scoring */
  currentPropertyType?: string;
  currentSubmarket?: string | null;
  /** Override how many to show (default 3) */
  limit?: number;
  /** Section title and subtitle */
  title?: string;
  subtitle?: string;
}

export async function RelatedListings({
  currentSlug,
  currentPropertyType,
  currentSubmarket,
  limit = 3,
  title = 'More Available Properties',
  subtitle = 'Other Texas commercial real estate currently available — vetted by CRECO principals.',
}: Props) {
  const all = await getListings('active').catch(() => [] as Listing[]);

  // Exclude the current listing
  const others = all.filter(l => l.slug !== currentSlug);

  // Score each remaining listing for relevance
  const scored = others
    .map(l => {
      let score = 0;
      if (currentPropertyType && l.property_type === currentPropertyType) score += 100;
      if (currentSubmarket && l.submarket === currentSubmarket) score += 50;
      // Newer listings get a small recency boost
      if (l.listing_date) {
        const days = (Date.now() - new Date(l.listing_date).getTime()) / (1000 * 60 * 60 * 24);
        score += Math.max(0, 30 - days);
      }
      return { listing: l, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.listing);

  if (scored.length === 0) return null;

  return (
    <section className="section-luxury bg-background-cream border-t border-border">
      <Container>
        <div className="mb-10 text-center">
          <p className="overline mb-3">Browse Inventory</p>
          <h2 className="font-heading text-display-sm font-bold text-primary gold-line gold-line-center inline-block pb-3">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-body text-foreground-muted">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {scored.map(l => (
            <PropertyCard key={l.id} listing={l} showPropertyTypeBadge />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button variant="outline" size="lg" asChild>
            <Link href="/listings">
              View All Texas Properties <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
