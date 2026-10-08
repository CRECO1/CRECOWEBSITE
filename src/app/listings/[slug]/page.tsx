// ISR: statically generate known listing slugs at build and revalidate every
// 30 min, instead of a cold Supabase round-trip (×3 queries) on every single
// view. Slugs not yet built render on-demand (dynamicParams default) and then
// cache. Was `force-dynamic` — the last public page never migrated to caching.
export const revalidate = 1800;

import { TalkToBroker } from '@/components/marketing/TalkToBroker';
import type { Metadata } from 'next';
import { metaDescription } from '@/lib/seo-meta';
import { JsonLd } from '@/components/seo/JsonLd';
import { FaqSection } from '@/components/marketing/FaqSection';
import { BUSINESS, assetCategory, breadcrumbList, listingPriceText, listingSchema, listingSummary } from '@/lib/schema';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Calendar, Building2, CheckCircle, Layers, Ruler, Truck, Map, Video } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs';
import { getListingBySlug, getListings } from '@/lib/supabase';
import { SYNTHETIC_LISTINGS } from '@/lib/featured-properties';
import { cache } from 'react';
import { formatPrice, formatSqft, formatAcres, formatLeaseRate, transactionLabel, propertyTypeLabel, googleMapsUrl } from '@/lib/utils';
import { ListingInquiryTabs } from './ListingInquiryTabs';
import { ListingViewTracker } from './ListingViewTracker';
import { MobileInquiryBar } from './MobileInquiryBar';
import { BrokerCard } from '@/components/marketing/BrokerCard';
import { getBrokerForListing, getLeadBackup } from '@/lib/broker';
import { RelatedListings } from '@/components/marketing/RelatedListings';
import { HubLinks } from '@/components/marketing/HubLinks';
import { hubLinksForListing } from '@/lib/hub-links';
import { ListingGallery } from '@/components/marketing/ListingGallery';
import { CompareToggle } from '@/components/listings/CompareToggle';
import { ListingDetailMap } from '@/components/listings/ListingDetailMap';
import { BrochureRequestForm } from '@/components/forms/BrochureRequestForm';
import { Bell } from 'lucide-react';
import type { Listing } from '@/lib/supabase';

// Leased/sold rows stay reachable at their URL (inbound links, /sold) but must
// never read as available: the title says "Leased"/"Sold" and the inquiry
// forms give way to a closed-deal panel.
function closedLabel(listing: Pick<Listing, 'status'>): 'Leased' | 'Sold' | null {
  if (listing.status === 'leased') return 'Leased';
  if (listing.status === 'sold') return 'Sold';
  return null;
}

// Dedupe the per-request fetch: generateMetadata() and the page body both need
// the listing, and without this each fires the same Supabase query. cache()
// lives here (a server-only module) rather than in the client-shared
// supabase.ts, so it never executes in a client bundle.
const getListing = cache(async (slug: string) => {
  const db = await getListingBySlug(slug).catch(() => null);
  if (db) return db;
  // Synthetic listings (CRECO-owned, code-defined in featured-properties.ts)
  // that do NOT carry a landing_url render here as a normal detail page — e.g.
  // the Elkhorn Point ±2-acre pad. Ones WITH a landing_url live at their own
  // page (elkhornpoint.com, bespoke routes), so they stay 404 here to avoid a
  // duplicate of that page.
  return SYNTHETIC_LISTINGS.find((l) => l.slug === slug && !l.landing_url) ?? null;
});

// Pre-render every current listing's detail page at build time (ISR above keeps
// them fresh). Falls back to fully on-demand if the DB is unreachable at build.
export async function generateStaticParams() {
  // Synthetic listings without a landing_url own a real detail page here — always
  // pre-render them even if the DB is unreachable at build.
  const synthParams = SYNTHETIC_LISTINGS
    .filter((l) => !l.landing_url)
    .map((l) => ({ slug: l.slug }));
  try {
    const listings = await getListings('all');
    return [...listings.map((l) => ({ slug: l.slug })), ...synthParams];
  } catch {
    return synthParams;
  }
}

// Per-listing metadata so each property has a unique <title>, <meta description>,
// canonical URL, and OG image (instead of inheriting the /listings index meta).
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug).catch(() => null);
  if (!listing) {
    return { title: 'Property Not Found | CRECO' };
  }
  const txn = closedLabel(listing) ?? (transactionLabel(listing.transaction_type) || 'Available');
  const type = propertyTypeLabel(listing.property_type) || 'Commercial Property';
  const sf = listing.sqft ? `${listing.sqft.toLocaleString()} SF ` : '';
  // Fit the ~60-character results-page title: drop the city, then the size, before
  // anything that identifies the property.
  const title = [
    `${listing.title} — ${sf}${type} ${txn} in ${listing.city ?? 'Texas'} | CRECO`,
    `${listing.title} — ${sf}${type} ${txn} | CRECO`,
    `${listing.title} — ${type} ${txn} | CRECO`,
  ].find(t => t.length <= 60) ?? `${listing.title} | CRECO`;
  const description =
    (listing.description && metaDescription(String(listing.description))) ||
    listing.headline ||
    `${type} ${txn.toLowerCase()} at ${listing.address}, ${listing.city ?? 'Texas'}, TX. Contact CRECO for full details, photos, and a tour.`;
  return {
    title,
    description,
    alternates: { canonical: `https://www.crecotx.com/listings/${listing.slug}` },
    openGraph: {
      title,
      description,
      url: `https://www.crecotx.com/listings/${listing.slug}`,
      type: 'website',
      // og:image comes from the colocated ./opengraph-image.tsx (branded card with the
      // listing photo, price and badge). Setting `images` here would override it with the
      // generic site card, which is what social/AI previews were showing.
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

interface Props { params: Promise<{ slug: string }> }

export default async function ListingDetailPage({ params }: Props) {
  const { slug } = await params;

  // No hardcoded fallback: a stale in-code copy of a listing (this used to
  // carry 1222 Chulie Dr at $9.50/SF while the DB said $10.00) would publish a
  // wrong asking rate — into the page AND its JSON-LD — on any transient DB
  // failure. A 404 is the honest failure mode for inventory we can't read.
  const listing = await getListing(slug).catch(() => null);
  if (!listing) notFound();

  const images = (listing!.images as string[] | null) ?? [];
  const closed = closedLabel(listing!);

  const priceDisplay = closed
    ? closed
    : listing!.transaction_type === 'sale' && listing!.sale_price
    ? formatPrice(listing!.sale_price)
    : listing!.lease_rate
      ? formatLeaseRate(listing!.lease_rate, listing!.lease_rate_basis)
      : 'Contact for pricing';
  // RealEstateListing (property as Accommodation w/ floorSize, geo, amenity
  // features; lease/sale Offer incl. "contact for pricing"; broker = CRECO @id)
  // + BreadcrumbList mirroring the visible crumb strip. Built in @/lib/schema
  // so listing pages, ItemLists and llms-full.txt all describe inventory the
  // same way.
  const broker = getBrokerForListing(listing!.slug);
  const allListingFaqs = [
    {
      q: `Is ${listing!.title} still available?`,
      a: listing!.status === 'active'
        ? `Yes. As of the latest update, ${listing!.title} is actively marketed by CRECO — ${listingSummary(listing!)}. Call ${BUSINESS.phoneDisplay} or email ${BUSINESS.email} to confirm current availability.`
        : `${listing!.title} is currently marked "${listing!.status}". Contact CRECO at ${BUSINESS.phoneDisplay} for its current status and for comparable ${assetCategory(listing!.property_type).toLowerCase()} options.`,
    },
    {
      q: `What is the asking ${listing!.transaction_type === 'sale' ? 'price' : 'rate'} for ${listing!.title}?`,
      a: `${listingPriceText(listing!)}.${listing!.sqft ? ` The property is ${listing!.sqft.toLocaleString()} SF` : ''}${listing!.available_sqft && listing!.available_sqft !== listing!.sqft ? ` with ${listing!.available_sqft.toLocaleString()} SF available` : ''}${listing!.sqft ? '.' : ''} Final terms depend on lease length, build-out, and credit — CRECO provides a full pricing package on request.`,
    },
    {
      q: `Who is the listing broker for ${listing!.title}?`,
      a: `${listing!.title} is listed by ${BUSINESS.name} (${BUSINESS.trecLicenseDisplay}), ${BUSINESS.fullAddress}. Inquiries go to ${broker.name}, ${broker.title} — ${broker.phone_display}, ${broker.email}.`,
    },
    {
      q: `How do I tour ${listing!.title}?`,
      a: `Request a tour with the form on this page or call ${BUSINESS.phoneDisplay}. CRECO responds personally and can arrange in-person or virtual tours.`,
    },
  ];
  // A closed deal has no asking price to quote and nothing to tour.
  const listingFaqs = closed ? [allListingFaqs[0], allListingFaqs[2]] : allListingFaqs;

  return (
    <>
      <JsonLd
        data={[
          listingSchema(listing!, { url: `/listings/${listing!.slug}` }),
          breadcrumbList([
            { name: 'Listings', path: '/listings' },
            { name: listing!.title, path: `/listings/${listing!.slug}` },
          ]),
        ]}
      />
      <Header variant="minimal" />
      <ListingViewTracker
        id={listing!.id}
        name={listing!.title}
        sale_price={listing!.sale_price}
        lease_rate={listing!.lease_rate}
        city={listing!.city}
        submarket={listing!.submarket}
        property_type={listing!.property_type}
        transaction_type={listing!.transaction_type}
        sqft={listing!.sqft}
      />
      {/* pb-24 lg:pb-0 reserves space under the MobileInquiryBar so the
          last bit of content (related listings, footer) isn't obscured. */}
      <main className={`min-h-screen pt-20 ${closed ? '' : 'pb-24 lg:pb-0'}`}>
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

        {/* Title, price and a one-field ask ABOVE the gallery. The gallery is a
            ~600px 4:3 hero, so with the title below it the first screen held
            only photos and Clarity showed 53% of visitors leaving before the
            10–15% scroll mark — most never saw the price or any way to respond.
            Campaign clicks land here, so the ask has to be on the first screen. */}
        <Container className="pt-6 pb-2">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-4">
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
                <div>
                  <p className="font-heading text-display-sm font-bold text-primary">
                    {priceDisplay}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {closed ? (
                      <span className="rounded-full bg-slate-700 px-3 py-0.5 text-caption font-semibold text-white uppercase">
                        {closed}
                      </span>
                    ) : (
                      <span className="rounded-full bg-gold/20 px-3 py-0.5 text-caption font-semibold text-gold-dark uppercase">
                        {transactionLabel(listing!.transaction_type)}
                      </span>
                    )}
                    <span className="rounded-full bg-primary/10 px-3 py-0.5 text-caption font-semibold text-primary uppercase">
                      {propertyTypeLabel(listing!.property_type)}
                    </span>
                  </div>
                  <div className="mt-3 flex">
                    <CompareToggle listingId={listing!.id} variant="full" />
                  </div>
                </div>
              </div>
            </div>
            {!closed && (
              <div className="lg:col-span-1">
                <BrochureRequestForm
                  listingSlug={listing!.slug}
                  listingTitle={listing!.title}
                  brochureUrl={listing!.brochure_url}
                />
                <a
                  href="#inquiry-tour"
                  className="mt-2 hidden items-center gap-1 text-body-sm font-semibold text-gold-dark hover:text-primary lg:inline-flex"
                >
                  Or schedule a tour →
                </a>
              </div>
            )}
          </div>
        </Container>

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
              {/* Key Stats */}
              <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { icon: Layers, label: 'Building SF', value: formatSqft(listing!.sqft) },
                  // Available SF only when it's a divisible space (differs from
                  // the building total) — a tenant looking for 5k SF in a 30k
                  // building needs to see what's actually available.
                  ...(listing!.available_sqft != null && listing!.available_sqft !== listing!.sqft
                    ? [{ icon: Ruler, label: 'Available SF', value: formatSqft(listing!.available_sqft) }]
                    : []),
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

              {/* Virtual / 3D tour — the URL is captured in the admin and the
                  Payload schema but was never surfaced publicly. Shows a
                  prominent CTA whenever a broker has added a Matterport / 3D
                  walkthrough link; renders nothing until then. */}
              {listing!.virtual_tour_url && (
                <div className="mb-8">
                  <a
                    href={listing!.virtual_tour_url}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-3 text-body-sm font-semibold text-primary transition-colors hover:bg-gold-dark"
                  >
                    <Video className="h-4 w-4" />
                    Take the 3D Virtual Tour
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
                {closed ? (
                  // Closed deal: no tour/message/brochure asks for a space
                  // that is no longer on the market.
                  <div>
                    <p className="text-caption font-semibold uppercase tracking-widest text-gold-dark">{closed}</p>
                    <h2 className="mt-1 font-heading text-heading font-semibold text-primary">
                      {closed === 'Leased' ? 'This space has been leased.' : 'This property has been sold.'}
                    </h2>
                    <p className="mt-2 text-body-sm text-foreground-muted">
                      It is no longer available. See what CRECO has on the market now.
                    </p>
                    <Link
                      href="/listings"
                      className="mt-4 inline-flex items-center justify-center rounded-lg bg-gold px-5 py-3 text-body-sm font-semibold text-primary transition-colors hover:bg-gold-dark"
                    >
                      View available listings
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* #inquiry-tour is where the mobile "Schedule a Tour" bar
                        lands and puts the cursor. */}
                    <div id="inquiry-tour" className="scroll-mt-24">
                      <ListingInquiryTabs
                        listingTitle={listing!.title}
                        listingSlug={listing!.slug}
                        listingAddress={`${listing!.address}, ${listing!.city}, ${listing!.state} ${listing!.zip ?? ''}`.trim()}
                        broker={broker}
                        brochureHref={listing!.brochure_url || `/api/brochure/${listing!.slug}`}
                      />
                    </div>
                    {/* The brochure used to sit above the tour form as its own
                        filled-button card, so the sidebar opened on two competing
                        asks. Tour is the one primary; the brochure is a quiet
                        link here and the offer after a tour request. */}
                    <div className="mt-4">
                      <BrochureRequestForm
                        listingSlug={listing!.slug}
                        listingTitle={listing!.title}
                        brochureUrl={listing!.brochure_url}
                        variant="link"
                      />
                    </div>
                  </>
                )}
                {/* Named broker + direct contact + optional Cal.com
                    slot. Replaces the anonymous "Or call us directly"
                    tile. The visible person on the sidebar next to a
                    listing detail form is a high-leverage trust
                    signal — visitors are much more likely to submit
                    when they can see who will actually reply. */}
                <div className="mt-6 pt-6 border-t border-border">
                  {/* Per-listing broker override — getBrokerForListing
                      returns the broker assigned in LISTING_BROKER_MAP
                      or falls back to LISTING_DEFAULT_BROKER (Brian,
                      who owns inbound leads). */}
                  <BrokerCard
                    broker={broker}
                    backup={getLeadBackup(broker)}
                    intro={closed ? 'Questions about this property:' : 'Your inquiry is going to:'}
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

        {!closed && (
          <TalkToBroker
            surface="listing"
            heading="Questions about this property?"
            body="Call or text a broker, or tell us what you need and we will follow up."
          />
        )}

        <FaqSection
          faqs={listingFaqs}
          path={`/listings/${listing!.slug}`}
          heading={`${listing!.title} — questions & answers`}
          className="section-luxury bg-background-cream border-t border-border"
        />

        {/* Back up to the city and asset hubs this property belongs to.
            Listing pages previously linked to neither, so the hubs we most
            want to rank collected nothing from the listings about them. */}
        <HubLinks
          links={hubLinksForListing(listing!)}
          label="Browse more"
        />

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
      {!closed && <MobileInquiryBar />}
      <Footer />
    </>
  );
}
