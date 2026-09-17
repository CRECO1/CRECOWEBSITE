'use client';

/**
 * Interactive listings hub. Data + the initial grid are rendered SERVER-SIDE by
 * the parent page.tsx (ISR) and handed in via `initialListings`, so the full
 * inventory is in the prerendered HTML for search engines — the page used to be
 * a client-only fetch wrapped in <Suspense fallback={null}> (because of
 * useSearchParams), which left the prerender empty and buried the page at ~page 4.
 *
 * This component still owns all the interactivity: filtering, the grid/map view
 * toggle, save-search, compare, and the lead-magnet bands. Deep-linked filter
 * URLs (?type=warehouse&txn=lease) are read from the URL *client-side after
 * mount* rather than via useSearchParams, so the component renders its grid
 * during SSR instead of bailing to a Suspense fallback.
 */

import { useState, useEffect, useMemo, useRef, Fragment } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, MapPin, Building2, Layers, X, Grid3x3, Map as MapIcon, BellRing } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { CompareToggle } from '@/components/listings/CompareToggle';
import { SaveSearchModal } from '@/components/listings/SaveSearchModal';
import { formatSqft, formatLeaseRate, formatPrice, transactionLabel, propertyTypeLabel } from '@/lib/utils';
import type { Listing } from '@/lib/supabase';
import { withSyntheticListings, listingLinkProps } from '@/lib/featured-properties';
import { PropertyAlertsInline } from '@/components/marketing/PropertyAlertsInline';
import { MarketReportCapture } from '@/components/marketing/MarketReportCapture';

// Map view is heavy (Google Maps JS API + @vis.gl bundle) — only loaded when
// the user opts in, so grid view keeps a tight first-load bundle for SEO.
const ListingsMap = dynamic(
  () => import('@/components/listings/ListingsMap').then(m => m.ListingsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center bg-background-cream rounded-xl border border-border" style={{ height: '70vh' }}>
        <p className="text-body-sm text-foreground-muted">Loading map…</p>
      </div>
    ),
  }
);

type View = 'grid' | 'map';

// Predefined options always shown in the dropdowns, in this order. Custom
// property/transaction types coming from the data get appended below these.
const PROPERTY_TYPE_PRESETS = ['office', 'warehouse', 'flex', 'retail', 'land'];
const TRANSACTION_TYPE_PRESETS = ['lease', 'sale'];

const SIZE_RANGES: { label: string; min: number; max: number }[] = [
  { label: 'Any Size', min: 0, max: Infinity },
  { label: 'Under 5,000 SF', min: 0, max: 5000 },
  { label: '5,000 – 15,000 SF', min: 5000, max: 15000 },
  { label: '15,000 – 50,000 SF', min: 15000, max: 50000 },
  { label: '50,000+ SF', min: 50000, max: Infinity },
];

export function ListingsClient({ initialListings, children }: { initialListings: Listing[]; children?: React.ReactNode }) {
  const router = useRouter();

  // Seeded from the server-fetched inventory (rendered in the SSR HTML). The
  // synthetic featured listings (e.g. 8000 Fair Oaks Plaza) are always merged
  // in so their cards never blink in/out.
  const [listings, setListings] = useState<Listing[]>(() => withSyntheticListings(initialListings));
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Filters default to unfiltered so the SSR render (and first client render)
  // shows the FULL inventory — deep-linked filter URLs are applied after mount
  // (see the effect below), which is why they can't seed useState here without
  // reintroducing the useSearchParams Suspense bail.
  const [search, setSearch] = useState('');
  const [propertyType, setPropertyType] = useState<string>('all');
  const [transactionType, setTransactionType] = useState<string>('all');
  const [submarket, setSubmarket] = useState<string>('all');
  const [sizeIdx, setSizeIdx] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<View>('grid');
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);

  // Gate URL-writing until we've read the incoming URL once, so the initial
  // render doesn't clobber a deep-linked ?type=…&txn=… back to bare /listings.
  const [urlRead, setUrlRead] = useState(false);

  // Read deep-linked filters from the URL AFTER mount (client-only), then enable
  // URL syncing. Runs once.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const type = sp.get('type'); if (type) setPropertyType(type);
    const txn = sp.get('txn'); if (txn) setTransactionType(txn);
    const sub = sp.get('submarket'); if (sub) setSubmarket(sub);
    const size = Number(sp.get('size') ?? '0'); if (Number.isFinite(size) && size) setSizeIdx(size);
    const q = sp.get('q'); if (q) setSearch(q);
    if (sp.get('view') === 'map') setView('map');
    setUrlRead(true);
  }, []);

  // Build dropdown options dynamically: preset values first, then any custom
  // values found in the actual listing data.
  const propertyTypeOptions = useMemo(() => {
    const customs = Array.from(new Set(listings.map(l => l.property_type).filter(Boolean)))
      .filter(v => !PROPERTY_TYPE_PRESETS.includes(v as string));
    return [
      { value: 'all', label: 'All Types' },
      ...PROPERTY_TYPE_PRESETS.map(v => ({ value: v, label: propertyTypeLabel(v) })),
      ...customs.map(v => ({ value: v as string, label: propertyTypeLabel(v as string) })),
    ];
  }, [listings]);

  const transactionTypeOptions = useMemo(() => {
    const customs = Array.from(new Set(listings.map(l => l.transaction_type).filter(Boolean)))
      .filter(v => !TRANSACTION_TYPE_PRESETS.includes(v as string) && v !== 'both');
    return [
      { value: 'all', label: 'Sale or Lease' },
      ...TRANSACTION_TYPE_PRESETS.map(v => ({ value: v, label: transactionLabel(v) })),
      ...customs.map(v => ({ value: v as string, label: transactionLabel(v as string) })),
    ];
  }, [listings]);

  const submarketOptions = useMemo(() => {
    const submarkets = Array.from(
      new Set(listings.map(l => l.submarket).filter(Boolean) as string[])
    ).sort();
    return [
      { value: 'all', label: 'All Submarkets' },
      ...submarkets.map(s => ({ value: s, label: s })),
    ];
  }, [listings]);

  // Keep the URL in sync with filter state (shareable/bookmarkable filtered
  // views). Held off until the incoming URL has been read.
  useEffect(() => {
    if (!urlRead || typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (propertyType !== 'all') params.set('type', propertyType);
    if (transactionType !== 'all') params.set('txn', transactionType);
    if (submarket !== 'all') params.set('submarket', submarket);
    if (sizeIdx !== 0) params.set('size', String(sizeIdx));
    if (search) params.set('q', search);
    if (view !== 'grid') params.set('view', view);
    const qs = params.toString();
    const next = qs ? `/listings?${qs}` : '/listings';
    if (`${window.location.pathname}${window.location.search}` !== next) {
      router.replace(next, { scroll: false });
    }
  }, [urlRead, propertyType, transactionType, submarket, sizeIdx, search, view, router]);

  // Refresh to the latest inventory client-side (ISR data may be up to the
  // revalidate window stale). The SSR/props data already populates the grid, so
  // this only updates it; a failure keeps the server-rendered listings and
  // surfaces a non-silent retry.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/listings');
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        if (cancelled) return;
        setListings(withSyntheticListings(d.listings ?? []));
        setLoadError(false);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const range = SIZE_RANGES[sizeIdx];
    return listings.filter(l => {
      const matchSearch = !search
        || l.title.toLowerCase().includes(search.toLowerCase())
        || l.address.toLowerCase().includes(search.toLowerCase())
        || (l.zip ?? '').includes(search)
        || (l.submarket ?? '').toLowerCase().includes(search.toLowerCase());
      const matchType = propertyType === 'all' || l.property_type === propertyType;
      const matchTxn = transactionType === 'all'
        || l.transaction_type === transactionType
        || l.transaction_type === 'both';
      const matchSubmarket = submarket === 'all' || l.submarket === submarket;
      const sf = l.sqft ?? 0;
      const matchSize = sf >= range.min && sf <= range.max;
      return matchSearch && matchType && matchTxn && matchSubmarket && matchSize;
    });
  }, [listings, search, propertyType, transactionType, submarket, sizeIdx]);

  const hasFilters = propertyType !== 'all' || transactionType !== 'all' || submarket !== 'all' || sizeIdx !== 0 || search !== '';

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        {/* Page Header */}
        <div className="bg-primary py-14 text-white">
          <Container>
            <p className="overline mb-2 text-gold">Available Now</p>
            <h1 className="font-heading text-display-sm font-bold">Texas Commercial Properties</h1>
            <p className="mt-2 text-body text-white/60">
              {listings.length} active commercial real estate listings — office, industrial, retail, flex, and land — across San Antonio, Austin, Houston, Dallas–Fort Worth, and the Hill Country.
            </p>
          </Container>
        </div>

        {/* Search & Filters */}
        <div className="sticky top-20 z-30 border-b border-border bg-white shadow-sm">
          <Container>
            <div className="flex flex-wrap items-center gap-3 py-4">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                <Input
                  placeholder="Search address, zip, or submarket…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <select
                value={propertyType}
                onChange={e => setPropertyType(e.target.value)}
                className="h-11 rounded-lg border border-border px-3 text-body-sm text-primary"
                aria-label="Filter by property type"
              >
                {propertyTypeOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>

              <select
                value={transactionType}
                onChange={e => setTransactionType(e.target.value)}
                className="h-11 rounded-lg border border-border px-3 text-body-sm text-primary"
                aria-label="Filter by sale or lease"
              >
                {transactionTypeOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>

              {submarketOptions.length > 2 && (
                <select
                  value={submarket}
                  onChange={e => setSubmarket(e.target.value)}
                  className="h-11 rounded-lg border border-border px-3 text-body-sm text-primary"
                  aria-label="Filter by submarket"
                >
                  {submarketOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              )}

              <button
                onClick={() => setFiltersOpen(v => !v)}
                className="flex h-11 items-center gap-2 rounded-lg border border-border px-4 text-body-sm text-primary hover:border-gold transition-colors"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Size
                {sizeIdx !== 0 && <span className="h-2 w-2 rounded-full bg-gold" />}
              </button>

              {hasFilters && (
                <button
                  onClick={() => { setSearch(''); setPropertyType('all'); setTransactionType('all'); setSubmarket('all'); setSizeIdx(0); }}
                  className="flex items-center gap-1 text-caption text-foreground-muted hover:text-primary transition-colors"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}

              {hasFilters && (
                <button
                  onClick={() => setSaveSearchOpen(true)}
                  className="flex h-11 items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/5 px-3 text-caption font-semibold text-gold-dark hover:bg-gold/10 hover:border-gold transition-colors"
                  title="Get alerts for properties matching these filters"
                >
                  <BellRing className="h-3.5 w-3.5" />
                  Save search
                </button>
              )}

              <div className="ml-auto inline-flex h-11 items-center rounded-lg border border-border bg-background-cream p-1">
                <button
                  onClick={() => setView('grid')}
                  className={`flex items-center gap-1.5 rounded-md px-3 h-full text-body-sm font-semibold transition-colors ${
                    view === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-foreground-muted hover:text-primary'
                  }`}
                  aria-pressed={view === 'grid'}
                  aria-label="Grid view"
                >
                  <Grid3x3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setView('map')}
                  className={`flex items-center gap-1.5 rounded-md px-3 h-full text-body-sm font-semibold transition-colors ${
                    view === 'map' ? 'bg-white text-primary shadow-sm' : 'text-foreground-muted hover:text-primary'
                  }`}
                  aria-pressed={view === 'map'}
                  aria-label="Map view"
                >
                  <MapIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Map</span>
                </button>
              </div>
            </div>

            {filtersOpen && (
              <div className="pb-4 flex flex-wrap gap-6 border-t border-border pt-4">
                <div>
                  <p className="label-readable">Building Size</p>
                  <div className="flex flex-wrap gap-2">
                    {SIZE_RANGES.map((r, i) => (
                      <button
                        key={r.label}
                        onClick={() => setSizeIdx(i)}
                        className={`rounded-full border px-4 py-1.5 text-caption transition-colors ${sizeIdx === i ? 'border-gold bg-gold text-primary' : 'border-border text-foreground-muted hover:border-gold'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Container>
        </div>

        {/* Grid or Map */}
        <div className="py-10">
          <Container>
            {loadError && (
              <div role="alert" className="mb-8 flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-body-sm text-primary">
                  We couldn&apos;t refresh the latest live inventory just now. The listings below are the most recent we have.
                </p>
                <button
                  type="button"
                  onClick={() => setReloadKey(k => k + 1)}
                  className="shrink-0 rounded-lg bg-primary px-4 py-2 text-body-sm font-semibold text-white hover:bg-primary/90"
                >
                  Retry
                </button>
              </div>
            )}
            {filtered.length === 0 ? (
              <div className="py-24 text-center">
                <Building2 className="mx-auto mb-4 h-12 w-12 text-foreground-subtle" />
                <h2 className="font-heading text-heading font-semibold text-primary">No properties found</h2>
                <p className="mt-2 text-body text-foreground-muted">Try adjusting your filters — or <Link href="/get-started" className="text-gold hover:text-gold-dark">submit your tenant needs</Link> and we&apos;ll bring options to you.</p>
              </div>
            ) : view === 'map' ? (
              <>
                <p className="mb-4 text-body-sm text-foreground-muted">
                  Showing {filtered.length} {filtered.length === 1 ? 'property' : 'properties'} on the map — click a pin for details.
                </p>
                <ListingsMap
                  listings={filtered}
                  hasFilters={hasFilters}
                  onClearFilters={() => {
                    setSearch('');
                    setPropertyType('all');
                    setTransactionType('all');
                    setSizeIdx(0);
                  }}
                />
                <p className="mt-3 text-caption text-foreground-muted text-center">
                  Some properties may not appear on the map until their location has been geocoded. Switch to Grid view to see the full inventory.
                </p>
              </>
            ) : (
              <>
                <p className="mb-6 text-body-sm text-foreground-muted">
                  Showing {filtered.length} {filtered.length === 1 ? 'property' : 'properties'}
                </p>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((listing, i) => (
                    <Fragment key={listing.id}>
                    <Link {...listingLinkProps(listing)} className="card-luxury group block">
                      <div className="image-luxury aspect-property bg-background-warm relative">
                        {listing.images && (listing.images as string[])[0] ? (
                          <Image src={(listing.images as string[])[0]} alt={listing.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-foreground-subtle">
                            <Building2 className="h-10 w-10" />
                          </div>
                        )}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                          <span className="rounded-full bg-gold px-3 py-1 text-caption font-semibold text-primary uppercase">
                            {transactionLabel(listing.transaction_type)}
                          </span>
                          <span className="rounded-full bg-white/95 px-3 py-1 text-caption font-semibold text-primary">
                            {propertyTypeLabel(listing.property_type)}
                          </span>
                        </div>
                        {!listing.landing_url && (
                          <div className="absolute top-4 right-4">
                            <CompareToggle listingId={listing.id} variant="icon" />
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <p className="mb-1 text-caption text-foreground-muted">
                          <MapPin className="mr-1 inline h-3 w-3" />
                          {listing.city}, TX{listing.submarket ? ` · ${listing.submarket}` : ''}
                        </p>
                        <h3 className="mb-2 font-heading text-heading-sm font-semibold text-primary group-hover:text-gold transition-colors line-clamp-1">
                          {listing.title}
                        </h3>
                        <p className="mb-4 text-body-sm text-foreground-muted line-clamp-2">{listing.headline ?? ''}</p>
                        <div className="mb-4 price-tag text-2xl">
                          {listing.transaction_type === 'sale' && listing.sale_price
                            ? formatPrice(listing.sale_price)
                            : listing.lease_rate
                              ? formatLeaseRate(listing.lease_rate, listing.lease_rate_basis)
                              : 'Contact for pricing'}
                        </div>
                        <div className="flex items-center gap-4 text-caption text-foreground-muted border-t border-border pt-4">
                          <span className="flex items-center gap-1.5"><Layers className="h-4 w-4" />{formatSqft(listing.sqft)}</span>
                          {listing.zoning && <span>Zoning {listing.zoning}</span>}
                          {listing.clear_height && <span>{listing.clear_height}&apos; clear</span>}
                        </div>
                      </div>
                    </Link>
                    {/* Loud lead-magnet injected mid-grid — browsers on the
                        listings page are the prime audience for new-listing
                        alerts, so we catch them in the flow instead of only at
                        the very bottom (which most never scroll to). */}
                    {filtered.length > 6 && i === 5 && (
                      <div className="sm:col-span-2 lg:col-span-3">
                        <PropertyAlertsInline variant="dark" surface="listings-inline" />
                      </div>
                    )}
                    </Fragment>
                  ))}
                </div>
              </>
            )}
          </Container>
        </div>

        {/* Lead-magnet band — catches the visitor who scrolled the entire grid
            and isn't ready to click into a specific listing. */}
        <div className="bg-background-cream border-t border-border py-12">
          <Container>
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PropertyAlertsInline variant="light" surface="listings-bottom" />
              <MarketReportCapture variant="light" surface="listings-bottom" />
            </div>
          </Container>
        </div>
        {/* Server-rendered extras from page.tsx (live-inventory FAQ). */}
        {children}
      </main>

      <SaveSearchModal
        open={saveSearchOpen}
        onClose={() => setSaveSearchOpen(false)}
        filters={{
          search,
          propertyType,
          transactionType,
          submarket,
          sizeLabel: SIZE_RANGES[sizeIdx]?.label ?? '',
          sizeMin: SIZE_RANGES[sizeIdx]?.min === 0 && SIZE_RANGES[sizeIdx]?.max === Infinity ? null : (SIZE_RANGES[sizeIdx]?.min ?? null),
          sizeMax: SIZE_RANGES[sizeIdx]?.max === Infinity ? null : (SIZE_RANGES[sizeIdx]?.max ?? null),
        }}
      />

      <Footer />
    </>
  );
}
