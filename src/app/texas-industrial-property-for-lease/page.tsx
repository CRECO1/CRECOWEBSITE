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
  title: 'Industrial & Warehouse for Lease in San Antonio & the Hill Country | CRECO',
  description:
    'Industrial, warehouse and flex space for lease in San Antonio and the Texas Hill Country — distribution, light manufacturing, flex and service-industrial on the I-35, I-10 and Loop 1604 corridors.',
  keywords: [
    'warehouse for lease san antonio',
    'industrial space for lease san antonio',
    'flex space for lease san antonio',
    'warehouse for lease boerne',
    'industrial property for lease texas hill country',
    'distribution center for lease san antonio',
    'flex industrial san antonio',
    'industrial property for lease texas',
  ],
  alternates: { canonical: 'https://www.crecotx.com/texas-industrial-property-for-lease' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Industrial & Warehouse for Lease in San Antonio & the Hill Country | CRECO',
    description:
      'San Antonio and Hill Country industrial — distribution, light manufacturing, flex and service-industrial on the I-35, I-10 and Loop 1604 corridors.',
    url: 'https://www.crecotx.com/texas-industrial-property-for-lease',
    type: 'website',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const db = await getLandingPage('texas-industrial-property-for-lease');
  return {
    ...baseMetadata,
    title: db?.meta_title || (baseMetadata.title as string),
    description: db?.meta_description || (baseMetadata.description as string),
  };
}

export default async function Page() {
  const dbContent = await getLandingPage('texas-industrial-property-for-lease').catch(() => null);
  return (
    <PropertyLandingPage
      dbContent={dbContent}
      config={{
        sourcesAsOf: 'April 2026',
        eyebrow: 'San Antonio & Hill Country · Industrial & Warehouse',
        h1: 'Industrial & Warehouse Space for Lease in San Antonio & the Hill Country',
        subhead:
          'Distribution, light manufacturing, flex-industrial, service-industrial, and contractor space — across San Antonio\'s industrial submarkets and the I-10 and I-35 corridors into the Hill Country. Whether you need a small flex bay for a service business or a larger distribution building, CRECO brings options with the right clear height, dock-door count, power, parking, and yard.',
        filterPropertyTypes: ['warehouse', 'industrial', 'flex'],
        filterTransactionType: 'lease',
        canonicalPath: '/texas-industrial-property-for-lease',
        marketBullets: [
          {
            title: 'San Antonio sits on the I-35 and I-10 corridors.',
            body: 'The Northeast / I-35 corridor toward Schertz and New Braunfels anchors modern bulk distribution, while infill flex and service-industrial on the North Side and along I-10 toward Boerne serve operators who need to be close to their customers.',
          },
          {
            title: 'Specs matter more than rent.',
            body: 'Two warehouses at the same $/SF rate can be wildly different deals. Clear height, dock-door ratios, trailer parking, power capacity (480V vs 277/480V three-phase), sprinkler systems (ESFR vs standard), and yard area all drive your operating cost. CRECO benchmarks every site on these specs.',
          },
          {
            title: 'Concessions are still on the table.',
            body: 'Even in tight markets, the right tenant — credit, term length, expansion path — can negotiate free rent, tenant improvement allowances for racking and office buildout, and rent escalators that beat market.',
          },
        ],
        whyBullets: [
          'Detailed property-spec underwriting (clear height, doors, power, sprinkler class, parking)',
          'Submarket comp analysis for honest rent benchmarking',
          'Free-rent and TI-allowance negotiation for racking, office, and buildout',
          'Multi-site strategy for distribution and last-mile expansion',
          'Local coverage: Northeast / I-35, Far Northwest / Loop 1604 and I-10, plus Hill Country flex and service-industrial',
        ],
        faqs: [
          {
            q: 'What does industrial space cost in San Antonio?',
            a: 'It depends on submarket, building age, clear height, and bay size — modern bulk distribution, older second-generation warehouse, and small-bay flex with office buildout all price differently. Most industrial is quoted triple-net (NNN). Our San Antonio industrial space page has CRECO\'s current estimates by product type; for comps on a specific building, call (210) 817-3443.',
          },
          {
            q: 'What clear height should I look for?',
            a: 'For typical distribution, 24-32 ft clear height is standard. 18-24 ft is common in older or Class C industrial. Modern bulk distribution centers built since 2018 are often 32-40 ft clear, accommodating 5-6 levels of pallet racking. The right clear height depends on your storage profile — if you stack 4 levels of pallet racking, 24 ft is the minimum; for narrow-aisle automation, 36+ ft is preferred.',
          },
          {
            q: 'How many dock doors do I need?',
            a: 'A common rule of thumb is 1 dock door per 5,000-10,000 SF, but it depends on throughput. High-velocity distribution and cross-dock operations may need 1 door per 2,000-3,000 SF. Service or storage operations may only need 1 door per 15,000-20,000 SF. Always confirm whether dock doors are dock-high (typical) or grade-level (drive-in) — they serve different purposes.',
          },
          {
            q: 'Where are the main San Antonio-area industrial submarkets?',
            a: 'In San Antonio: the Northeast (the I-35 corridor toward Schertz and New Braunfels) for modern bulk distribution, and the Far Northwest (Loop 1604 / I-10) for flex and smaller-bay product closer to the North Side. Up the I-10 corridor, Boerne and the Hill Country communities have a smaller supply of mostly small-bay flex and service-industrial space. The right one depends on where your customers, employees, and trucks need to go.',
          },
          {
            q: 'Can CRECO help with cold storage or specialized industrial?',
            a: 'Yes. Cold storage, food-grade, hazmat-rated, lab, manufacturing with heavy power requirements, and refrigerated distribution all require specialized site selection — and plenty of buildings claim specs they don\'t actually meet. We verify the specs that matter before you tour.',
          },
          {
            q: 'Do you only work in San Antonio and the Hill Country?',
            a: 'That is where we focus and where we own property. If you\'re a tenant with a requirement elsewhere in Texas, we can help there too.',
          },
        ],
        relatedLinks: [
          { href: '/san-antonio-industrial-space', label: 'San Antonio Industrial Space' },
          { href: '/submarkets/northeast', label: 'San Antonio Northeast' },
          { href: '/texas-retail-space-for-lease', label: 'Retail Space' },
          { href: '/texas-office-space-for-lease', label: 'Office Space' },
          { href: '/texas-commercial-property-for-sale', label: 'Properties for Sale' },
          { href: '/services/tenant-representation', label: 'Tenant Representation' },
          { href: '/listings?type=warehouse', label: 'All Industrial Listings' },
        ],
        primaryCta: { href: '/get-started', label: 'Get Started' },
        secondaryCta: { href: 'tel:+12108173443', label: '(210) 817-3443' },
      }}
    />
  );
}
