export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { PropertyLandingPage } from '@/components/marketing/PropertyLandingPage';
import { getLandingPage } from '@/lib/supabase';

const baseMetadata: Metadata = {
  title: 'Retail Space for Lease in Texas | CRECO',
  description:
    'Retail space for lease across Texas — strip centers, freestanding restaurants, urban storefronts, mixed-use, and shopping center inline space. CRECO connects retail tenants and franchisees with vetted Texas locations across San Antonio, Austin, Houston, Dallas–Fort Worth, and beyond.',
  keywords: [
    'retail space for lease texas',
    'texas retail space',
    'retail space for lease san antonio',
    'retail space for lease austin',
    'retail space for lease houston',
    'retail space for lease dallas',
    'restaurant space for lease texas',
    'strip center for lease texas',
    'retail commercial real estate texas',
    'storefront for lease texas',
  ],
  alternates: { canonical: 'https://www.crecotx.com/texas-retail-space-for-lease' },
  openGraph: {
    title: 'Retail Space for Lease in Texas | CRECO',
    description:
      'Texas retail space — strip centers, freestanding restaurants, urban storefronts, and shopping centers across San Antonio, Austin, Houston, and DFW.',
    url: 'https://www.crecotx.com/texas-retail-space-for-lease',
    type: 'website',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const db = await getLandingPage('texas-retail-space-for-lease');
  return {
    ...baseMetadata,
    title: db?.meta_title || (baseMetadata.title as string),
    description: db?.meta_description || (baseMetadata.description as string),
  };
}

export default async function Page() {
  const dbContent = await getLandingPage('texas-retail-space-for-lease').catch(() => null);
  return (
    <PropertyLandingPage
      dbContent={dbContent}
      config={{
        eyebrow: 'Texas Commercial Real Estate · Retail',
        h1: 'Retail Space for Lease in Texas',
        subhead:
          'Strip centers, freestanding restaurants, urban storefronts, mixed-use, and shopping-center inline space — all across the major Texas markets. Whether you\'re a single-location operator scouting your first space or a franchise developer rolling out 20 locations, CRECO brings vetted Texas retail real estate options that match your concept, traffic counts, demographics, and budget.',
        filterPropertyTypes: ['retail'],
        filterTransactionType: 'lease',
        demoListings: [
          { id: 'd1', title: 'Stone Oak Retail Endcap', slug: '#', address: '— San Antonio —', city: 'San Antonio', property_type: 'retail', transaction_type: 'lease', sqft: 2400, headline: 'Endcap with high visibility on signalized intersection in Stone Oak', images: null, lease_rate: 32, lease_rate_basis: 'NNN' },
          { id: 'd2', title: 'Austin South Lamar Storefront', slug: '#', address: '— Austin —', city: 'Austin', property_type: 'retail', transaction_type: 'lease', sqft: 1800, headline: 'Walkable South Lamar storefront — restaurant or boutique fit', images: null, lease_rate: 48, lease_rate_basis: 'NNN' },
          { id: 'd3', title: 'Houston Galleria Inline', slug: '#', address: '— Houston —', city: 'Houston', property_type: 'retail', transaction_type: 'lease', sqft: 3200, headline: 'Class A inline retail space in established Galleria-area center', images: null, lease_rate: 38, lease_rate_basis: 'NNN' },
        ],
        marketBullets: [
          {
            title: 'Texas retail demand is strong.',
            body: 'Population growth, daytime traffic, and disposable-income trends across Texas — particularly the I-35 corridor between San Antonio and Dallas — are driving sustained retail leasing activity. Vacancy rates in well-located centers remain in the single digits.',
          },
          {
            title: 'Submarket fundamentals matter more than ever.',
            body: 'The right retail location is determined by traffic counts, demographics, co-tenancy, and signage visibility — not just price per SF. CRECO underwrites every site against your specific concept and target customer.',
          },
          {
            title: 'Lease structures are negotiable.',
            body: 'Tenant improvement allowances, free rent, percentage rent, exclusivity clauses, and CAM caps all move with the right negotiator. We close the gap between asking rent and effective rent.',
          },
        ],
        whyBullets: [
          'Tenant-side representation — we never represent the landlord on the same deal',
          'Traffic-count, demographic, and co-tenancy analysis on every shortlist site',
          'LOI and lease negotiation focused on tenant improvement allowances, free rent, and exclusivity',
          'Buildout coordination from architect to grand opening',
          'Multi-location rollout strategy for franchisees and growing concepts',
        ],
        faqs: [
          {
            q: 'How much does retail space cost per square foot in Texas?',
            a: 'Retail rates in Texas typically range from $18 to $55 per SF per year on a triple-net (NNN) basis, depending heavily on submarket, center class, and visibility. Class A power centers in Austin or DFW can exceed $60/SF NNN; secondary submarkets and older inline space can be found at $18-25/SF NNN. Always factor in NNN charges (typically $6-12/SF) and tenant improvement allowance when comparing offers.',
          },
          {
            q: 'How long is a typical retail lease in Texas?',
            a: 'Initial retail leases in Texas are typically 5 to 10 years, often with renewal options. Restaurants and franchisees typically commit to longer terms (7-10 years) in exchange for buildout allowances; pop-up and short-term tenants can sometimes negotiate 1-3 year terms in soft submarkets.',
          },
          {
            q: 'What is "NNN" and how does it affect my retail rent?',
            a: 'Triple-net (NNN) means the tenant pays a base rent plus their proportional share of the property\'s taxes, insurance, and common area maintenance (CAM) — typically $6-12/SF/yr in Texas centers. Always ask the landlord for the actual NNN figure (not just an estimate) and request CAM reconciliations from prior years before signing.',
          },
          {
            q: 'Can CRECO help with restaurant space specifically?',
            a: 'Yes. Restaurant deals require special diligence — grease trap, hood ventilation, parking ratios, alcohol licensing zoning, drive-thru permitting, and patio rights all matter. We work with multiple Texas restaurant operators and franchise developers and know what to negotiate.',
          },
          {
            q: 'I have an existing Texas retail lease — can you help me renew or relocate?',
            a: 'Absolutely. Renewal-vs-relocation analysis is one of the highest-leverage CRECO services. We benchmark your current rent against the market, identify alternative options, and use that competitive tension to negotiate a stronger renewal — or move you somewhere better.',
          },
        ],
        relatedLinks: [
          { href: '/texas-industrial-property-for-lease', label: 'Industrial / Warehouse' },
          { href: '/texas-office-space-for-lease', label: 'Office Space' },
          { href: '/texas-commercial-property-for-sale', label: 'Properties for Sale' },
          { href: '/services/tenant-representation', label: 'Tenant Representation' },
          { href: '/submarkets', label: 'San Antonio Submarkets' },
          { href: '/listings?type=retail', label: 'All Retail Listings' },
        ],
        primaryCta: { href: '/tenant-needs', label: 'Submit Tenant Needs' },
        secondaryCta: { href: 'tel:+12108173443', label: '(210) 817-3443' },
      }}
    />
  );
}
