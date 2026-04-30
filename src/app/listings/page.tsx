'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, SlidersHorizontal, MapPin, Building2, Layers, X } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { formatSqft, formatLeaseRate, formatPrice, transactionLabel, propertyTypeLabel } from '@/lib/utils';
import type { Listing } from '@/lib/supabase';

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
    listing_date: '2026-04-10', closed_date: null, submarket: 'Northeast', created_at: '', updated_at: '',
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
    listing_date: '2026-03-22', closed_date: null, submarket: 'North Central', created_at: '', updated_at: '',
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
    listing_date: '2026-04-01', closed_date: null, submarket: 'Northeast', created_at: '', updated_at: '',
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

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>(DEMO_LISTINGS);
  const [search, setSearch] = useState('');
  const [propertyType, setPropertyType] = useState<string>('all');
  const [transactionType, setTransactionType] = useState<string>('all');
  const [sizeIdx, setSizeIdx] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  // Read query string filter (?type=warehouse, ?txn=lease) on first mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get('type');
    const txn = params.get('txn');
    if (t) setPropertyType(t);
    if (txn) setTransactionType(txn);
  }, []);

  useEffect(() => {
    fetch('/api/listings').then(r => r.json()).then(d => {
      if (d.listings?.length) setListings(d.listings);
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
            <h1 className="font-heading text-display-sm font-bold">Commercial Properties</h1>
            <p className="mt-2 text-body text-white/60">
              {listings.length} active listings across the San Antonio market
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

        {/* Grid */}
        <div className="py-10">
          <Container>
            {filtered.length === 0 ? (
              <div className="py-24 text-center">
                <Building2 className="mx-auto mb-4 h-12 w-12 text-foreground-subtle" />
                <h2 className="font-heading text-heading font-semibold text-primary">No properties found</h2>
                <p className="mt-2 text-body text-foreground-muted">Try adjusting your filters — or <Link href="/tenant-needs" className="text-gold hover:text-gold-dark">submit your tenant needs</Link> and we&apos;ll bring options to you.</p>
              </div>
            ) : (
              <>
                <p className="mb-6 text-body-sm text-foreground-muted">
                  Showing {filtered.length} {filtered.length === 1 ? 'property' : 'properties'}
                </p>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map(listing => (
                    <Link key={listing.id} href={`/listings/${listing.slug}`} className="card-luxury group block">
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
      </main>
      <Footer />
    </>
  );
}
