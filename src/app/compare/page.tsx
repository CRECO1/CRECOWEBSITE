'use client';

/**
 * Side-by-side comparison of up to 4 listings the user has shortlisted.
 * Pulls full listing detail from /api/listings (so we don't have to ship the
 * full inventory in localStorage), filters to selected IDs, and renders a
 * scrollable comparison grid.
 *
 * Empty state guides the user back to /listings to pick something.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Building2, MapPin, Scale, X } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { useCompareList } from '@/hooks/useCompareList';
import { formatPrice, formatLeaseRate, formatSqft, formatAcres, propertyTypeLabel, transactionLabel } from '@/lib/utils';
import type { Listing } from '@/lib/supabase';

interface Row {
  label: string;
  value: (l: Listing) => React.ReactNode;
}

const ROWS: Row[] = [
  { label: 'Type', value: l => propertyTypeLabel(l.property_type) },
  { label: 'Transaction', value: l => transactionLabel(l.transaction_type) },
  { label: 'Address', value: l => l.address },
  { label: 'City / Submarket', value: l => `${l.city}${l.submarket ? ` · ${l.submarket}` : ''}` },
  {
    label: 'Price / Rate',
    value: l => l.transaction_type === 'sale' && l.sale_price
      ? formatPrice(l.sale_price)
      : l.lease_rate
        ? formatLeaseRate(l.lease_rate, l.lease_rate_basis)
        : 'Contact for pricing',
  },
  { label: 'Total SF', value: l => formatSqft(l.sqft) },
  { label: 'Available SF', value: l => formatSqft(l.available_sqft ?? l.sqft) },
  { label: 'Lot Size', value: l => formatAcres(l.lot_size) },
  { label: 'Year Built', value: l => l.year_built ?? '—' },
  { label: 'Zoning', value: l => l.zoning ?? '—' },
  { label: 'Clear Height', value: l => l.clear_height ? `${l.clear_height}'` : '—' },
  { label: 'Dock Doors', value: l => l.dock_doors ?? '—' },
  { label: 'Grade Doors', value: l => l.grade_doors ?? '—' },
];

export default function ComparePage() {
  const { ids, remove, clear } = useCompareList();
  const [allListings, setAllListings] = useState<Listing[] | null>(null);

  useEffect(() => {
    fetch('/api/listings?status=all')
      .then(r => r.json())
      .then(d => setAllListings(d.listings ?? []))
      .catch(() => setAllListings([]));
  }, []);

  const selected = useMemo(() => {
    if (!allListings) return null;
    // Preserve insertion order from the shortlist
    return ids
      .map(id => allListings.find(l => l.id === id))
      .filter((l): l is Listing => Boolean(l));
  }, [allListings, ids]);

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-primary py-12 sm:py-14 text-white">
          <Container>
            <p className="overline mb-2 text-gold flex items-center gap-2">
              <Scale className="h-3.5 w-3.5" /> Compare Listings
            </p>
            <h1 className="font-heading text-display-sm sm:text-display-md font-bold mb-3">
              Side-by-side comparison
            </h1>
            <p className="text-body text-white/70 max-w-2xl">
              {ids.length === 0
                ? "Add up to 4 properties from the listings page and view them side-by-side here. Specs, pricing, sizes — all stacked."
                : `Comparing ${ids.length} ${ids.length === 1 ? 'property' : 'properties'}. Tap "Remove" to drop a listing, or `}
              {ids.length > 0 && (
                <button onClick={clear} className="text-gold underline hover:text-gold-light">clear all</button>
              )}
              {ids.length > 0 && '.'}
            </p>
          </Container>
        </section>

        {/* Comparison */}
        <section className="bg-background-cream py-12">
          <Container>
            {ids.length === 0 ? (
              <EmptyState />
            ) : selected === null ? (
              <div className="py-24 text-center text-foreground-muted">Loading…</div>
            ) : selected.length === 0 ? (
              <EmptyState message="The properties you selected are no longer available." />
            ) : (
              <div className="overflow-x-auto -mx-4 px-4 sm:-mx-0 sm:px-0">
                <div className="min-w-[640px]">
                  <ComparisonTable listings={selected} onRemove={remove} />
                </div>
              </div>
            )}
          </Container>
        </section>

        {/* Help */}
        {ids.length > 0 && (
          <section className="bg-white py-12 border-t border-border">
            <Container>
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-heading text-heading-lg font-bold text-primary mb-3">Want CRECO's read on these properties?</h2>
                <p className="text-body text-foreground-muted mb-6">
                  Send us your shortlist and we'll come back with our take on which property fits your situation best — fundamentals, comparable rents, deal terms to expect.
                </p>
                <Link
                  href="/get-started"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3 text-body-sm font-semibold text-white hover:bg-primary/90"
                >
                  Talk to a CRECO broker
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Container>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

function ComparisonTable({ listings, onRemove }: { listings: Listing[]; onRemove: (id: string) => void }) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `160px repeat(${listings.length}, minmax(220px, 1fr))` }}
    >
      {/* Header row: image + title + remove */}
      <div /> {/* spacer for label column */}
      {listings.map(l => (
        <div key={l.id} className="rounded-xl bg-white shadow-card overflow-hidden flex flex-col">
          <div className="relative aspect-[4/3] bg-background-warm">
            {l.images && l.images[0] ? (
              <Image src={l.images[0]} alt={l.title} fill sizes="280px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-foreground-subtle">
                <Building2 className="h-8 w-8" />
              </div>
            )}
            <button
              type="button"
              onClick={() => onRemove(l.id)}
              title="Remove from comparison"
              aria-label="Remove from comparison"
              className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4 flex flex-col flex-1">
            <p className="text-caption text-foreground-muted mb-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {l.city}, TX
            </p>
            <h3 className="font-heading text-heading-sm font-semibold text-primary mb-3 line-clamp-2">
              {l.title}
            </h3>
            <Link
              href={`/listings/${l.slug}`}
              className="mt-auto inline-flex items-center gap-1.5 text-caption font-semibold text-gold-dark hover:text-gold"
            >
              View details <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      ))}

      {/* Spec rows */}
      {ROWS.map((row, idx) => (
        <RowGroup key={row.label} row={row} listings={listings} striped={idx % 2 === 0} />
      ))}
    </div>
  );
}

function RowGroup({ row, listings, striped }: { row: Row; listings: Listing[]; striped: boolean }) {
  const bg = striped ? 'bg-white' : 'bg-background-warm/60';
  return (
    <>
      <div className={`${bg} flex items-center px-4 py-3 rounded-l-md text-caption uppercase tracking-widest font-semibold text-foreground-muted`}>
        {row.label}
      </div>
      {listings.map(l => (
        <div key={l.id} className={`${bg} flex items-center px-4 py-3 text-body-sm text-primary`}>
          {row.value(l)}
        </div>
      ))}
    </>
  );
}

function EmptyState({ message }: { message?: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-white py-20 text-center">
      <Scale className="mx-auto h-12 w-12 text-gold/60 mb-4" />
      <h2 className="font-heading text-heading-lg font-bold text-primary mb-2">Nothing to compare yet</h2>
      <p className="text-body text-foreground-muted max-w-md mx-auto mb-6">
        {message ?? 'Browse the listings, tap the compare icon on each one you’re considering, and they’ll show up here side-by-side.'}
      </p>
      <Link
        href="/listings"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3 text-body-sm font-semibold text-white hover:bg-primary/90"
      >
        Browse listings
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
