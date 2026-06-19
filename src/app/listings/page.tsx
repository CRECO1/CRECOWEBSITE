'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
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

const DEMO_LISTINGS: Listing[] = [
  {
    id: '1', title: '1222 Chulie Dr', slug: '1222-chulie-dr',
    address: '1222 Chulie Dr', city: 'San Antonio', state: 'TX', zip: '78219',
    property_type: 'warehouse', transaction_type: 'lease',
    sale_price: null, lease_rate: 9.50, lease_rate_basis: 'NNN',
    sqft: 16100, available_sqft: 16100, lot_size: 1.2, zoning: 'I-1', year_built: 1998,
    clear_height: 22, dock_doors: 4, grade_doors: 1,
    headline: '16,100 SF warehouse with dock and grade doors',
    description: null, features: ['Dock-high loading', 'Grade-level door', 'Fenced yard'],
    images: null, brochure_url: null, virtual_tour_url: null, status: 'active',
    listing_date: '2026-04-10', closed_date: null, submarket: 'Northeast', featured: false,
    latitude: 29.498, longitude: -98.367, geocoded_at: null,
    created_at: '', updated_at: '',
  },
  {
    id: '2', title: '1346 Parkridge Dr', slug: '1346-parkridge-dr',
    address: '1346 Parkridge Dr', city: 'San Antonio', state: 'TX', zip: '78213',
    property_type: 'office', transaction_type: 'sale',
    sale_price: 875000, lease_rate: null, lease_rate_basis: null,
    sqft: 2475, available_sqft: 2475, lot_size: 1.7, zoning: 'C-2', year_built: 2004,
    clear_height: null, dock_doors: null, grade_doors: null,
    headline: '1.7 acres with 2,475 SF office building',
    description: null, features: ['Stand-alone building', 'Ample parking', 'Highway visibility'],
    images: null, brochure_url: null, virtual_tour_url: null, status: 'active',
    listing_date: '2026-03-22', closed_date: null, submarket: 'North Central', featured: false,
    latitude: 29.526, longitude: -98.491, geocoded_at: null,
    created_at: '', updated_at: '',
  },
  {
    id: '3', title: '2250 Chipley Circle', slug: '2250-chipley-circle',
    address: '2250 Chipley Cir', city: 'San Antonio', state: 'TX', zip: '78219',
    property_type: 'warehouse', transaction_type: 'lease',
    sale_price: null, lease_rate: 8.75, lease_rate_basis: 'NNN',
    sqft: 26400, available_sqft: 26400, lot_size: 2.4, zoning: 'I-1', year_built: 2001,
    clear_height: 24, dock_doors: 6, grade_doors: 2,
    headline: '26,400 SF warehouse, I-1 zoning',
    description: null, features: ['Heavy power', 'Cross-dock layout', 'Fenced & secured'],
    images: null, brochure_url: null, virtual_tour_url: null, status: 'active',
    listing_date: '2026-04-01', closed_date: null, submarket: 'Northeast', featured: false,
    latitude: 29.503, longitude: -98.372, geocoded_at: null,
    created_at: '', updated_at: '',
  },
];

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

/**
 * Wrapper required by Next.js 15: useSearchParams() inside the component
 * forces this branch into the client suspense boundary, otherwise the
 * static prerender at /listings will fail to bail out cleanly.
 */
export default function ListingsPage() {
  return (
    <Suspense fallback={null}>
      <ListingsPageInner />
    </Suspense>
  );
}

function ListingsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Hydrate initial state from URL so deep-linked + bookmarked filtered views
  // ("?type=warehouse&txn=lease&size=2&q=northeast") restore on first paint
  // instead of mounting empty and snapping to filtered a tick later.
  const initialType = searchParams.get('type') ?? 'all';
  const initialTxn = searchParams.get('txn') ?? 'all';
  const initialSize = Number(searchParams.get('size') ?? '0');
  const initialQ = searchParams.get('q') ?? '';
  const initialView: View = searchParams.get('view') === 'map' ? 'map' : 'grid';

  // Synthetic listings (e.g. 8000 Fair Oaks Plaza) are always prepended
  // to the array regardless of whether the API call has come back yet —
  // so the property card never blinks in/out as the network resolves.
  const [listings, setListings] = useState<Listing[]>(() => withSyntheticListings(DEMO_LISTINGS));
  const [search, setSearch] = useState(initialQ);
  const [propertyType, setPropertyType] = useState<string>(initialType);
  const [transactionType, setTransactionType] = useState<string>(initialTxn);
  const [sizeIdx, setSizeIdx] = useState(Number.isFinite(initialSize) ? initialSize : 0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<View>(initialView);
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);

  // Build dropdown options dynamically: preset values first, then any custom
  // values found in the actual listing data. This way custom types added in
  // /admin (like "self-storage") appear in the public filter automatically.
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

  // Keep the URL in sync with filter state so a filtered view is shareable
  // and bookmarkable. Using router.replace (not push) so the back button
  // doesn't snapshot every keystroke in the search box.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (propertyType !== 'all') params.set('type', propertyType);
    if (transactionType !== 'all') params.set('txn', transactionType);
    if (sizeIdx !== 0) params.set('size', String(sizeIdx));
    if (search) params.set('q', search);
    if (view !== 'grid') params.set('view', view);
    const qs = params.toString();
    const next = qs ? `/listings?${qs}` : '/listings';
    // Only update if it actually changed — avoids infinite loops with Next router
    if (`${window.location.pathname}${window.location.search}` !== next) {
      router.replace(next, { scroll: false });
    }
  }, [propertyType, transactionType, sizeIdx, search, view, router]);

  useEffect(() => {
    fetch('/api/listings').then(r => r.json()).then(d => {
      // Always merge the synthetic listings in — even when the DB call
      // returns 0 rows (e.g. fresh deploy with an empty `listings` table)
      // the Fair Oaks Plaza card must still render.
      if (d.listings) setListings(withSyntheticListings(d.listings));
    }).catch(() => {});
  }, []);

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
      const sf = l.sqft ?? 0;
      const matchSize = sf >= range.min && sf <= range.max;
      return matchSearch && matchType && matchTxn && matchSize;
    });
  }, [listings, search, propertyType, transactionType, sizeIdx]);

  const hasFilters = propertyType !== 'all' || transactionType !== 'all' || sizeIdx !== 0 || search !== '';

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
              >
                {propertyTypeOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>

              <select
                value={transactionType}
                onChange={e => setTransactionType(e.target.value)}
                className="h-11 rounded-lg border border-border px-3 text-body-sm text-primary"
              >
                {transactionTypeOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>

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
                  onClick={() => { setSearch(''); setPropertyType('all'); setTransactionType('all'); setSizeIdx(0); }}
                  className="flex items-center gap-1 text-caption text-foreground-muted hover:text-primary transition-colors"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}

              {/* Save-search → property-alerts in one click. Only shown when
                  the visitor has at least one filter active — otherwise the
                  CTA reads as "subscribe to literally everything" and is
                  worth deferring to the full /property-alerts form. */}
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

              {/* View toggle — Grid (default) vs Map. The map view is the
                  defining UX upgrade for CRE shoppers, who hunt by location
                  more than by spec. URL persists so views are shareable. */}
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
                  {filtered.map(listing => (
                    <Link key={listing.id} {...listingLinkProps(listing)} className="card-luxury group block">
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
                        <div className="absolute top-4 right-4">
                          <CompareToggle listingId={listing.id} variant="icon" />
                        </div>
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
                  ))}
                </div>
              </>
            )}
          </Container>
        </div>

        {/* Lead-magnet band — catches the visitor who scrolled the
            entire grid and isn't ready to click into a specific
            listing. Property alerts captures email for new-listing
            notifications; market report captures email for the
            quarterly read. Two parallel low-friction signups. */}
        <div className="bg-background-cream border-t border-border py-12">
          <Container>
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PropertyAlertsInline variant="light" surface="listings-bottom" />
              <MarketReportCapture variant="light" surface="listings-bottom" />
            </div>
          </Container>
        </div>
      </main>

      {/* Save-search modal. Mounted at the page root so it overlays
          everything (filter bar, view toggle, footer). State controlled
          from the Save search button up above. Filters are derived from
          the same source-of-truth state the grid/map use. */}
      <SaveSearchModal
        open={saveSearchOpen}
        onClose={() => setSaveSearchOpen(false)}
        filters={{
          search,
          propertyType,
          transactionType,
          sizeLabel: SIZE_RANGES[sizeIdx]?.label ?? '',
          sizeMin: SIZE_RANGES[sizeIdx]?.min === 0 && SIZE_RANGES[sizeIdx]?.max === Infinity ? null : (SIZE_RANGES[sizeIdx]?.min ?? null),
          sizeMax: SIZE_RANGES[sizeIdx]?.max === Infinity ? null : (SIZE_RANGES[sizeIdx]?.max ?? null),
        }}
      />

      <Footer />
    </>
  );
}
