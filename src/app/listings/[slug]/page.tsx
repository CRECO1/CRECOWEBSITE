export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Calendar, Phone, ArrowLeft, Building2, CheckCircle, Layers, Ruler, Truck, Download, Map } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { getListingBySlug } from '@/lib/supabase';
import { formatPrice, formatSqft, formatAcres, formatLeaseRate, transactionLabel, propertyTypeLabel } from '@/lib/utils';
import { ListingContactForm } from './ListingContactForm';
import { RelatedListings } from '@/components/marketing/RelatedListings';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!listing && DEMO[slug]) listing = DEMO[slug] as any;
  if (!listing) notFound();

  const images = (listing!.images as string[] | null) ?? [];

  const priceDisplay = listing!.transaction_type === 'sale' && listing!.sale_price
    ? formatPrice(listing!.sale_price)
    : listing!.lease_rate
      ? formatLeaseRate(listing!.lease_rate, listing!.lease_rate_basis)
      : 'Contact for pricing';

  // Build RealEstateListing JSON-LD for rich search results
  const listingSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing!.title,
    description: listing!.description ?? listing!.headline ?? `${listing!.property_type} property at ${listing!.address}, ${listing!.city}, ${listing!.state}`,
    image: images.length > 0 ? images : ['https://www.crecotx.com/images/creco-logo.jpg'],
    category: `Commercial Real Estate · ${listing!.property_type}`,
    offers: listing!.transaction_type === 'sale' && listing!.sale_price
      ? {
          '@type': 'Offer',
          price: listing!.sale_price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: `https://www.crecotx.com/listings/${listing!.slug}`,
          seller: { '@id': 'https://www.crecotx.com/#business' },
        }
      : listing!.lease_rate
        ? {
            '@type': 'Offer',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: listing!.lease_rate,
              priceCurrency: 'USD',
              unitCode: 'FTK', // Square Foot
              billingIncrement: 'yearly',
              description: `${listing!.lease_rate_basis ?? 'NNN'} per SF per year`,
            },
            availability: 'https://schema.org/InStock',
            url: `https://www.crecotx.com/listings/${listing!.slug}`,
            seller: { '@id': 'https://www.crecotx.com/#business' },
          }
        : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listingSchema) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'RealEstateListing',
            name: listing!.title,
            url: `https://www.crecotx.com/listings/${listing!.slug}`,
            description: listing!.description ?? listing!.headline ?? '',
            datePosted: listing!.listing_date ?? listing!.created_at,
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
              floorSize: listing!.sqft
                ? { '@type': 'QuantitativeValue', value: listing!.sqft, unitCode: 'FTK' }
                : undefined,
            },
            broker: { '@id': 'https://www.crecotx.com/#business' },
          }),
        }}
      />
      <Header variant="minimal" />
      <main className="min-h-screen pt-20">
        {/* Back */}
        <div className="border-b border-border bg-background-cream py-4">
          <Container>
            <Link href="/listings" className="inline-flex items-center gap-2 text-body-sm text-foreground-muted hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Listings
            </Link>
          </Container>
        </div>

        {/* Image Gallery */}
        <div className="bg-background-warm">
          <Container className="py-6">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div className="md:col-span-2 aspect-[4/3] relative rounded-xl overflow-hidden bg-background-cream">
                {images[0] ? (
                  <Image src={images[0]} alt={listing!.title} fill sizes="(max-width: 768px) 100vw, 66vw" className="object-cover" priority />
                ) : (
                  <div className="flex h-full items-center justify-center text-foreground-subtle">
                    <Building2 className="h-20 w-20" />
                  </div>
                )}
              </div>
              <div className="grid grid-rows-2 gap-3">
                {[1, 2].map(i => (
                  <div key={i} className="aspect-[4/3] relative rounded-xl overflow-hidden bg-background-cream">
                    {images[i] ? (
                      <Image src={images[i]} alt={`${listing!.title} – ${propertyTypeLabel(listing!.property_type)} property in ${listing!.city}, TX (photo ${i + 1})`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-foreground-subtle">
                        <Building2 className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </div>

        {/* Detail Content */}
        <Container className="py-10">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">

            {/* Main */}
            <div className="lg:col-span-2">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-caption text-foreground-muted mb-1">
                    <MapPin className="mr-1 inline h-3 w-3" />
                    {listing!.address}, {listing!.city}, {listing!.state} {listing!.zip}
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
                  <div className="mt-2 flex flex-wrap justify-end gap-2">
                    <span className="rounded-full bg-gold/20 px-3 py-0.5 text-caption font-semibold text-gold-dark uppercase">
                      {transactionLabel(listing!.transaction_type)}
                    </span>
                    <span className="rounded-full bg-primary/10 px-3 py-0.5 text-caption font-semibold text-primary uppercase">
                      {propertyTypeLabel(listing!.property_type)}
                    </span>
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

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 rounded-xl border border-border bg-white p-6 shadow-card">
                <h3 className="mb-2 font-heading text-heading font-semibold text-primary">
                  Interested in this property?
                </h3>
                <p className="mb-6 text-body-sm text-foreground-muted">
                  Request a tour, brochure, or additional financials. A CRECO broker will respond within one business day.
                </p>
                <ListingContactForm listingTitle={listing!.title} />
                <div className="mt-6 pt-6 border-t border-border text-center">
                  <p className="text-caption text-foreground-muted mb-2">Or call us directly</p>
                  <a href="tel:+12108173443" className="inline-flex items-center gap-2 font-semibold text-primary hover:text-gold transition-colors">
                    <Phone className="h-5 w-5" />
                    (210) 817-3443
                  </a>
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
      <Footer />
    </>
  );
}
