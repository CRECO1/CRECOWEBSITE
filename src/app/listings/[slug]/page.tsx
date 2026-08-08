export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { jsonLd } from '@/lib/jsonLd';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Calendar, Building2, CheckCircle, Layers, Ruler, Truck, Download, Map } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs';
import { getListingBySlug } from '@/lib/supabase';
import { formatPrice, formatSqft, formatAcres, formatLeaseRate, formatMonthlyRent, transactionLabel, propertyTypeLabel, googleMapsUrl } from '@/lib/utils';
import { ListingInquiryTabs } from './ListingInquiryTabs';
import { MobileInquiryBar } from './MobileInquiryBar';
import { BrokerCard } from '@/components/marketing/BrokerCard';
import { getBrokerForListing } from '@/lib/broker';
import { RelatedListings } from '@/components/marketing/RelatedListings';
import { ListingGallery } from '@/components/marketing/ListingGallery';
import { CompareToggle } from '@/components/listings/CompareToggle';
import { ListingDetailMap } from '@/components/listings/ListingDetailMap';
import { BrochureRequestForm } from '@/components/forms/BrochureRequestForm';
import { Bell } from 'lucide-react';

// Per-listing metadata so each property has a unique <title>, <meta description>,
// canonical URL, and OG image (instead of inheriting the /listings index meta).
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug).catch(() => null);
  if (!listing) {
    return { title: 'Property Not Found | CRECO' };
  }
  const txn = transactionLabel(listing.transaction_type) || 'Available';
  const type = propertyTypeLabel(listing.property_type) || 'Commercial Property';
  const sf = listing.sqft ? `${listing.sqft.toLocaleString()} SF ` : '';
  const title = `${listing.title} — ${sf}${type} ${txn} in ${listing.city ?? 'Texas'} | CRECO`;
  const description =
    (listing.description && String(listing.description).trim().slice(0, 160)) ||
    listing.headline ||
    `${type} ${txn.toLowerCase()} at ${listing.address}, ${listing.city ?? 'Texas'}, TX. Contact CRECO for full details, photos, and a tour.`;
  const heroImage = Array.isArray(listing.images) && listing.images[0] ? listing.images[0] : 'https://www.crecotx.com/images/creco-logo.jpg';
  return {
    title,
    description,
    alternates: { canonical: `https://www.crecotx.com/listings/${listing.slug}` },
    openGraph: {
      title,
      description,
      url: `https://www.crecotx.com/listings/${listing.slug}`,
      type: 'website',
      images: [{ url: heroImage, alt: listing.title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [heroImage] },
  };
}

const DEMO: Record<string, object> = {
  '1222-chulie-dr': {
    id: '1', title: '1222 Chulie Dr', slug: '1222-chulie-dr',
    address: '1222 Chulie Dr', city: 'San Antonio', state: 'TX', zip: '78219',
    property_type: 'warehouse', transaction_type: 'lease',
    sale_price: null, lease_rate: 9.50, lease_rate_basis: 'NNN',
    sqft: 16100, available_sqft: 16100, lot_size: 1.2, zoning: 'I-1', year_built: 1998,
    clear_height: 22, dock_doors: 4, grade_doors: 1,
    headline: '16,100 SF warehouse with dock and grade doors',
    description: 'Well-located industrial building in the Northeast San Antonio submarket. Heavy power, cross-dock-friendly layout, and a fenced & paved yard make this an excellent fit for distribution, light manufacturing, or service operations. Easy access to I-35 and Loop 410.',
    features: ['4 dock-high doors', '1 grade-level door', '22\' clear height', 'Fenced & paved yard', 'Heavy 3-phase power', 'Office build-out included'],
    images: null, brochure_url: null, virtual_tour_url: null, status: 'active',
    listing_date: '2026-04-10', submarket: 'Northeast',
  },
};

interface Props { params: Promise<{ slug: string }> }

export default async function ListingDetailPage({ params }: Props) {
  const { slug } = await params;

  let listing = await getListingBySlug(slug).catch(() => null);
  if (!listing && DEMO[slug]) listing = DEMO[slug] as any;
  if (!listing) notFound();

  const images = (listing!.images as string[] | null) ?? [];

  const priceDisplay = listing!.transaction_type === 'sale' && listing!.sale_price
    ? formatPrice(listing!.sale_price)
    : listing!.lease_rate
      ? formatLeaseRate(listing!.lease_rate, listing!.lease_rate_basis)
      : 'Contact for pricing';
  // Monthly-rent supplement for lease listings — shown below the
  // $/SF/yr headline so both audiences (institutional buyers who think
  // in $/SF/yr, local operators who think in $/mo) see their preferred
  // format without having to do the math. Empty string when the
  // property isn't a lease or is missing SF/rate — falsy check in JSX
  // skips rendering.
  const monthlyRentDisplay = listing!.transaction_type !== 'sale'
    ? formatMonthlyRent(listing!.lease_rate, listing!.sqft, listing!.lease_rate_basis)
    : '';

  // Build the offer block once — used by the consolidated RealEstateListing
  // schema below. Lease and sale need different shapes: sale gets a flat
  // Offer with `price`, lease gets a UnitPriceSpecification under an Offer
  // with the per-SF-per-year rate. `businessFunction` makes the lease-vs-
  // sale distinction explicit (HTTP/LeaseOut vs Sell) — Google and LLM
  // entity graphs both use this to classify the listing.
  const offerBlock = listing!.transaction_type === 'sale' && listing!.sale_price
    ? {
        '@type': 'Offer',
        businessFunction: 'https://schema.org/Sell',
        price: listing!.sale_price,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `https://www.crecotx.com/listings/${listing!.slug}`,
        seller: { '@id': 'https://www.crecotx.com/#business' },
      }
    : listing!.lease_rate
      ? {
          '@type': 'Offer',
          businessFunction: 'https://schema.org/LeaseOut',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: listing!.lease_rate,
            priceCurrency: 'USD',
            unitCode: 'FTK', // Square Foot (UN/CEFACT)
            billingIncrement: 'yearly',
            description: `${listing!.lease_rate_basis ?? 'NNN'} per SF per year`,
          },
          availability: 'https://schema.org/InStock',
          url: `https://www.crecotx.com/listings/${listing!.slug}`,
          seller: { '@id': 'https://www.crecotx.com/#business' },
        }
      : undefined;

  // Build amenityFeature from the listing's freeform features[] array +
  // structured industrial fields (clear_height, dock_doors, grade_doors).
  // LLMs and Google rich results both use amenityFeature to compare
  // properties — populated values directly improve entity-graph fit.
  const amenityFeatures: Array<{ '@type': 'LocationFeatureSpecification'; name: string; value?: number | boolean }> = [];
  // Features array — comes from Payload's array field as [{feature: '...'}]
  const rawFeatures = (listing as { features?: Array<{ feature?: string }> }).features ?? [];
  for (const f of rawFeatures) {
    if (f?.feature) amenityFeatures.push({ '@type': 'LocationFeatureSpecification', name: f.feature, value: true });
  }
  if (listing!.clear_height) {
    amenityFeatures.push({ '@type': 'LocationFeatureSpecification', name: 'Clear height (ft)', value: Number(listing!.clear_height) });
  }
  if (listing!.dock_doors) {
    amenityFeatures.push({ '@type': 'LocationFeatureSpecification', name: 'Dock-high doors', value: Number(listing!.dock_doors) });
  }
  if (listing!.grade_doors) {
    amenityFeatures.push({ '@type': 'LocationFeatureSpecification', name: 'Grade-level doors', value: Number(listing!.grade_doors) });
  }
  if (listing!.zoning) {
    amenityFeatures.push({ '@type': 'LocationFeatureSpecification', name: `Zoning: ${listing!.zoning}` });
  }

  // Single consolidated RealEstateListing schema. Previously the page
  // emitted both Product + RealEstateListing — Google treats duplicate
  // schemas for the same entity as a signal of confusion. This is one
  // canonical record with everything search engines + LLMs need.
  const listingSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': `https://www.crecotx.com/listings/${listing!.slug}#listing`,
    name: listing!.title,
    url: `https://www.crecotx.com/listings/${listing!.slug}`,
    description:
      listing!.description
      ?? listing!.headline
      ?? `${listing!.property_type} property at ${listing!.address}, ${listing!.city}, ${listing!.state}`,
    image: images.length > 0 ? images : ['https://www.crecotx.com/images/creco-logo.jpg'],
    datePosted: listing!.listing_date ?? listing!.created_at,
    category: `Commercial Real Estate · ${listing!.property_type}`,
    mainEntity: {
      '@type': 'CommercialProperty',
      name: listing!.title,
      address: {
        '@type': 'PostalAddress',
        streetAddress: listing!.address,
        addressLocality: listing!.city,
        addressRegion: listing!.state,
        postalCode: listing!.zip,
        addressCountry: 'US',
      },
      // geo gives Google + LLMs the lat/lng so the listing can show in
      // local-pack / map-based rich results and surface in "industrial
      // space near X" AI answers. Only emit when geocoded — incorrect
      // coordinates are worse than missing ones.
      geo: listing!.latitude != null && listing!.longitude != null
        ? {
            '@type': 'GeoCoordinates',
            latitude: Number(listing!.latitude),
            longitude: Number(listing!.longitude),
          }
        : undefined,
      floorSize: listing!.sqft
        ? { '@type': 'QuantitativeValue', value: listing!.sqft, unitCode: 'FTK' }
        : undefined,
      yearBuilt: listing!.year_built ?? undefined,
      amenityFeature: amenityFeatures.length > 0 ? amenityFeatures : undefined,
    },
    offers: offerBlock,
    broker: { '@id': 'https://www.crecotx.com/#business' },
  };

  // Visible breadcrumb above is mirrored by this BreadcrumbList JSON-LD —
  // Google's recommendation is to keep schema and rendered HTML in sync
  // so the two reinforce each other.
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',     item: 'https://www.crecotx.com/' },
      { '@type': 'ListItem', position: 2, name: 'Listings', item: 'https://www.crecotx.com/listings' },
      { '@type': 'ListItem', position: 3, name: listing!.title, item: `https://www.crecotx.com/listings/${listing!.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(listingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />
      <Header variant="minimal" />
      {/* pb-24 lg:pb-0 reserves space under the MobileInquiryBar so the
          last bit of content (related listings, footer) isn't obscured. */}
      <main className="min-h-screen pt-20 pb-24 lg:pb-0">
        {/* Breadcrumb strip — replaces the old "Back to Listings" link
            (the first chevron still points back to /listings, and the
            full path tells Google + LLMs where this page sits in the
            site hierarchy). Pairs with the BreadcrumbList we'll emit
            with the rest of the listing JSON-LD via a sub-graph
            below — but at minimum the visible breadcrumb itself is a
            stronger AI-citation signal than a one-link back nav. */}
        <div className="border-b border-border bg-background-cream py-4">
          <Container>
            <Breadcrumbs
              items={[
                { label: 'Listings', href: '/listings' },
                { label: listing!.title },
              ]}
            />
          </Container>
        </div>

        {/* Image Gallery — click to open lightbox */}
        <ListingGallery
          images={images}
          altPrefix={`${listing!.title} – ${propertyTypeLabel(listing!.property_type)} property in ${listing!.city}, TX`}
        />

        {/* Detail Content */}
        <Container className="py-10">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">

            {/* Main */}
            <div className="lg:col-span-2">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-caption text-foreground-muted mb-1">
                    <MapPin className="mr-1 inline h-3 w-3" />
                    <a
                      href={googleMapsUrl(`${listing!.address}, ${listing!.city}, ${listing!.state} ${listing!.zip}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open property location in Google Maps"
                      className="hover:text-gold transition-colors"
                    >
                      {listing!.address}, {listing!.city}, {listing!.state} {listing!.zip}
                    </a>
                    {listing!.submarket ? ` · ${listing!.submarket}` : ''}
                  </p>
                  <h1 className="font-heading text-display-sm font-bold text-primary">
                    {listing!.title}
                  </h1>
                  {listing!.headline && (
                    <p className="mt-2 text-body text-foreground-muted">{listing!.headline}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-heading text-display-sm font-bold text-primary">
                    {priceDisplay}
                  </p>
                  {/* Monthly-rent supplement for lease listings.
                      Local operators quote in $/mo, institutional in
                      $/SF/yr — showing both eliminates the mental math
                      and prevents "is this affordable?" bounce. */}
                  {monthlyRentDisplay && (
                    <p className="text-body-sm text-foreground-muted mt-1">
                      {monthlyRentDisplay}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap justify-end gap-2">
                    <span className="rounded-full bg-gold/20 px-3 py-0.5 text-caption font-semibold text-gold-dark uppercase">
                      {transactionLabel(listing!.transaction_type)}
                    </span>
                    <span className="rounded-full bg-primary/10 px-3 py-0.5 text-caption font-semibold text-primary uppercase">
                      {propertyTypeLabel(listing!.property_type)}
                    </span>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <CompareToggle listingId={listing!.id} variant="full" />
                  </div>
                </div>
              </div>

              {/* Key Stats */}
              <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { icon: Layers, label: 'Building SF', value: formatSqft(listing!.sqft) },
                  { icon: Ruler, label: 'Lot Size', value: listing!.lot_size != null ? formatAcres(listing!.lot_size) : '—' },
                  { icon: Calendar, label: 'Year Built', value: listing!.year_built ?? '—' },
                  { icon: Map, label: 'Zoning', value: listing!.zoning ?? '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-xl border border-border p-4 text-center">
                    <Icon className="mx-auto mb-2 h-5 w-5 text-gold" />
                    <div className="font-heading text-heading font-bold text-primary">{value}</div>
                    <div className="text-caption text-foreground-muted">{label}</div>
                  </div>
                ))}
              </div>

              {/* Industrial-specific stats, only if any are set */}
              {(listing!.clear_height || listing!.dock_doors || listing!.grade_doors) && (
                <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {listing!.clear_height && (
                    <div className="flex items-center gap-3 rounded-lg bg-background-cream p-4">
                      <Ruler className="h-5 w-5 text-gold" />
                      <div>
                        <div className="text-caption text-foreground-muted">Clear height</div>
                        <div className="font-semibold text-primary">{listing!.clear_height}&apos;</div>
                      </div>
                    </div>
                  )}
                  {listing!.dock_doors != null && (
                    <div className="flex items-center gap-3 rounded-lg bg-background-cream p-4">
                      <Truck className="h-5 w-5 text-gold" />
                      <div>
                        <div className="text-caption text-foreground-muted">Dock doors</div>
                        <div className="font-semibold text-primary">{listing!.dock_doors}</div>
                      </div>
                    </div>
                  )}
                  {listing!.grade_doors != null && (
                    <div className="flex items-center gap-3 rounded-lg bg-background-cream p-4">
                      <Building2 className="h-5 w-5 text-gold" />
                      <div>
                        <div className="text-caption text-foreground-muted">Grade doors</div>
                        <div className="font-semibold text-primary">{listing!.grade_doors}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {listing!.description && (
                <div className="mb-8">
                  <h2 className="mb-4 font-heading text-heading-lg font-semibold text-primary">About This Property</h2>
                  <p className="text-body text-foreground-muted leading-relaxed whitespace-pre-line">{listing!.description as string}</p>
                </div>
              )}

              {/* Features */}
              {Array.isArray(listing!.features) && (listing!.features as string[]).length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-4 font-heading text-heading-lg font-semibold text-primary">Highlights</h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(listing!.features as string[]).map(f => (
                      <div key={f} className="flex items-center gap-2 text-body-sm text-foreground-muted">
                        <CheckCircle className="h-4 w-4 shrink-0 text-gold" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location map — only renders when the listing has been
                  geocoded (latitude+longitude present). Includes a "Get
                  directions" link as the conversion CTA next to the map. */}
              {listing!.latitude != null && listing!.longitude != null && (
                <div className="mb-8">
                  <h2 className="mb-4 font-heading text-heading-lg font-semibold text-primary">Location</h2>
                  <ListingDetailMap
                    latitude={Number(listing!.latitude)}
                    longitude={Number(listing!.longitude)}
                    address={`${listing!.address}, ${listing!.city}, ${listing!.state} ${listing!.zip ?? ''}`.trim()}
                    title={listing!.title}
                    propertyType={listing!.property_type}
                  />
                </div>
              )}

              {/* Brochure */}
              {listing!.brochure_url && (
                <div className="mb-8">
                  <a
                    href={listing!.brochure_url}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-gold px-5 py-3 text-body-sm font-semibold text-gold-dark transition-colors hover:bg-gold hover:text-primary"
                  >
                    <Download className="h-4 w-4" />
                    Download Marketing Brochure
                  </a>
                </div>
              )}
            </div>

            {/* Sidebar — tabbed inquiry (Tour | Message). #inquiry anchor is
                the scroll target for the mobile bottom action bar. The
                scroll-mt accounts for the fixed Header so the panel doesn't
                slide under it. */}
            <div className="lg:col-span-1">
              <div
                id="inquiry"
                className="sticky top-28 scroll-mt-24 rounded-xl border border-border bg-white p-6 shadow-card"
              >
                {/* Lowest-commitment ask first — capture the email-only crowd
                    before they bounce. Tour scheduling is one step heavier
                    (name + phone + date + format) and lives below in the tabs. */}
                <div className="mb-5">
                  <BrochureRequestForm
                    listingSlug={listing!.slug}
                    listingTitle={listing!.title}
                    brochureUrl={listing!.brochure_url}
                  />
                </div>
                <ListingInquiryTabs
                  listingTitle={listing!.title}
                  listingSlug={listing!.slug}
                  listingAddress={`${listing!.address}, ${listing!.city}, ${listing!.state} ${listing!.zip ?? ''}`.trim()}
                  broker={getBrokerForListing(listing!.slug)}
                />
                {/* Named broker + direct contact + optional Cal.com
                    slot. Replaces the anonymous "Or call us directly"
                    tile. The visible person on the sidebar next to a
                    listing detail form is a high-leverage trust
                    signal — visitors are much more likely to submit
                    when they can see who will actually reply. */}
                <div className="mt-6 pt-6 border-t border-border">
                  {/* Per-listing broker override — getBrokerForListing
                      returns the broker assigned in LISTING_BROKER_MAP
                      or falls back to PRIMARY_BROKER. Louis Pasteur
                      (move-in-ready-medical-building) routes to Brian
                      Blanco; the other listings still land with Zach. */}
                  <BrokerCard
                    broker={getBrokerForListing(listing!.slug)}
                    intro="Your inquiry is going to:"
                  />
                </div>
                {/* Re-engagement CTA — for tenants who looked but aren't ready
                    to submit an inquiry. Drives them into the Property Alerts
                    funnel pre-filtered to similar property type. */}
                <div className="mt-6 pt-6 border-t border-border">
                  <Link
                    href={`/property-alerts?type=${encodeURIComponent(listing!.property_type)}${listing!.submarket ? `&submarket=${encodeURIComponent(listing!.submarket)}` : ''}`}
                    className="flex items-start gap-3 rounded-lg border border-gold/30 bg-gold/5 p-4 text-left transition-colors hover:border-gold hover:bg-gold/10"
                  >
                    <Bell className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                    <div>
                      <p className="text-body-sm font-semibold text-primary">
                        Not quite this one?
                      </p>
                      <p className="mt-0.5 text-caption text-foreground-muted">
                        Get email alerts for similar {propertyTypeLabel(listing!.property_type).toLowerCase()}{listing!.submarket ? ` in ${listing!.submarket}` : ''} as they hit the market.
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>

        {/* More Available Properties — cross-sell */}
        <RelatedListings
          currentSlug={listing!.slug}
          currentPropertyType={listing!.property_type}
          currentSubmarket={listing!.submarket}
          limit={3}
          title="More Available Properties"
          subtitle={`Other Texas commercial real estate currently on the market — prioritized by similar property type${listing!.submarket ? ' and submarket' : ''}.`}
        />
      </main>
      <MobileInquiryBar />
      <Footer />
    </>
  );
}
