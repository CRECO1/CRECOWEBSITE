// 30-min ISR — listings + CMS content change slowly; saves the
// per-visit server render that force-dynamic was costing.
export const revalidate = 1800;

import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { PropertyLandingPage } from '@/components/marketing/PropertyLandingPage';
import { getLandingPage } from '@/lib/supabase';

// The URL keeps its original "texas-" slug (inbound links + rankings), but the
// copy is San Antonio & Hill Country — where CRECO works and owns property.
// NOTE: the landing_pages row for this slug overrides the hero/meta/bullets/
// FAQs below when populated; keep it in sync (see
// supabase/landing-pages-sa-hill-country.sql).
const baseMetadata: Metadata = {
  title: 'Retail Space for Lease in San Antonio & the Hill Country | CRECO',
  description:
    'Retail space for lease in San Antonio and the Texas Hill Country — strip centers, restaurant space, inline shop space and pads in Stone Oak, Leon Springs, Fair Oaks Ranch, Boerne and the I-10 corridor.',
  keywords: [
    'retail space for lease san antonio',
    'retail space for lease texas hill country',
    'retail space for lease boerne',
    'retail space for lease fair oaks ranch',
    'retail space for lease leon springs',
    'restaurant space for lease san antonio',
    'strip center for lease san antonio',
    'storefront for lease san antonio',
    'retail space for lease texas',
  ],
  alternates: { canonical: 'https://www.crecotx.com/texas-retail-space-for-lease' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Retail Space for Lease in San Antonio & the Hill Country | CRECO',
    description:
      'Retail space in San Antonio and the Texas Hill Country — strip centers, restaurant space, inline shop space and pads, from a team that owns and leases retail here.',
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
        sourcesAsOf: 'April 2026',
        eyebrow: 'San Antonio & Hill Country · Retail',
        h1: 'Retail Space for Lease in San Antonio & the Texas Hill Country',
        subhead:
          'Strip centers, restaurant space, inline shop space, pads, and mixed-use storefronts — in San Antonio and the Hill Country, from Stone Oak and the I-10 corridor to Leon Springs, Fair Oaks Ranch, and Boerne. Whether you\'re a single-location operator scouting your first space or a franchise developer planning several locations, CRECO brings options that match your concept, traffic counts, demographics, and budget — from a team that owns and leases retail here itself.',
        filterPropertyTypes: ['retail'],
        filterTransactionType: 'lease',
        canonicalPath: '/texas-retail-space-for-lease',
        marketBullets: [
          {
            title: 'Growth is moving north and west.',
            body: 'New rooftops along Loop 1604, the I-10 corridor toward Boerne, and the Hill Country communities are pulling neighborhood retail, restaurant, medical, and service tenants outward. Well-located new space in those corridors is limited, so the best positions are worth locking in early.',
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
          'Tenant representation for retail and restaurant concepts — from a team that owns and leases its own retail centers in Fair Oaks Ranch and Lytle',
          'Local knowledge of San Antonio and Hill Country corridors — Stone Oak, Leon Springs and I-10, Fair Oaks Ranch, and Boerne',
          'Traffic-count, demographic, and co-tenancy analysis on every shortlist site',
          'LOI and lease negotiation focused on tenant improvement allowances, free rent, and exclusivity',
          'Buildout coordination from architect to grand opening',
        ],
        faqs: [
          {
            q: 'How much does retail space cost in San Antonio and the Hill Country?',
            a: 'It depends heavily on the corridor, the center, and the position within it — an end-cap with drive-thru potential on a signalized corner prices very differently from inline space set back from the road, and new construction prices differently from second-generation space. Most retail here is quoted triple-net (NNN), so compare base rent plus the NNN estimate, and weigh tenant improvement allowance and free rent alongside the rate. Our San Antonio retail space page has CRECO\'s current estimates by retail type; for comps on a specific site, call (210) 817-3443.',
          },
          {
            q: 'How long is a typical retail lease?',
            a: 'Initial retail leases are typically 5 to 10 years, often with renewal options. Restaurants and franchisees typically commit to longer terms (7-10 years) in exchange for buildout allowances; pop-up and short-term tenants can sometimes negotiate 1-3 year terms in softer centers.',
          },
          {
            q: 'What is "NNN" and how does it affect my retail rent?',
            a: 'Triple-net (NNN) means the tenant pays a base rent plus their proportional share of the property\'s taxes, insurance, and common area maintenance (CAM). Always ask the landlord for the actual NNN figure (not just an estimate) and request CAM reconciliations from prior years before signing.',
          },
          {
            q: 'Can CRECO help with restaurant space specifically?',
            a: 'Yes. Restaurant deals require special diligence — grease trap, hood ventilation, parking ratios, alcohol licensing and zoning, drive-thru permitting, and patio rights all matter. We know what to look for on a site and what to negotiate in the lease.',
          },
          {
            q: 'I have an existing retail lease — can you help me renew or relocate?',
            a: 'Absolutely. Renewal-vs-relocation analysis is one of the highest-leverage CRECO services. We benchmark your current rent against the market, identify alternative options, and use that competitive tension to negotiate a stronger renewal — or move you somewhere better.',
          },
          {
            q: 'Do you only work in San Antonio and the Hill Country?',
            a: 'That is where we focus and where we own property. If you\'re a tenant with a requirement elsewhere in Texas, we can help there too.',
          },
        ],
        relatedLinks: [
          { href: '/san-antonio-retail-space', label: 'San Antonio Retail Space' },
          { href: '/boerne-commercial-real-estate', label: 'Boerne' },
          { href: '/fair-oaks-ranch-commercial-real-estate', label: 'Fair Oaks Ranch' },
          { href: '/texas-office-space-for-lease', label: 'Office Space' },
          { href: '/texas-industrial-property-for-lease', label: 'Industrial / Warehouse' },
          { href: '/texas-commercial-property-for-sale', label: 'Properties for Sale' },
          { href: '/services/tenant-representation', label: 'Tenant Representation' },
          { href: '/listings?type=retail', label: 'All Retail Listings' },
        ],
        primaryCta: { href: '/get-started', label: 'Get Started' },
        secondaryCta: { href: 'tel:+12108173443', label: '(210) 817-3443' },
      }}
    />
  );
}
