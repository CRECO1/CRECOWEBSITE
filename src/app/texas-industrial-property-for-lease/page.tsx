export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { PropertyLandingPage } from '@/components/marketing/PropertyLandingPage';
import { getLandingPage } from '@/lib/supabase';

const baseMetadata: Metadata = {
  title: 'Industrial & Warehouse Property for Lease in Texas | CRECO',
  description:
    'Industrial property and warehouse for lease across Texas — distribution, light manufacturing, flex-industrial, last-mile logistics, and cold storage. CRECO works the I-35 corridor, Houston Ship Channel, DFW industrial submarkets, and beyond.',
  keywords: [
    'industrial property for lease texas',
    'warehouse for lease texas',
    'texas industrial real estate',
    'distribution center for lease texas',
    'warehouse for lease san antonio',
    'warehouse for lease austin',
    'warehouse for lease houston',
    'warehouse for lease dallas',
    'industrial space for lease texas',
    'flex industrial texas',
    'last mile logistics texas',
    'cold storage texas',
  ],
  alternates: { canonical: 'https://www.crecotx.com/texas-industrial-property-for-lease' },
  openGraph: {
    title: 'Industrial & Warehouse Property for Lease in Texas | CRECO',
    description:
      'Texas industrial real estate — distribution, manufacturing, flex, last-mile. I-35 corridor, Houston Ship Channel, DFW industrial markets, and statewide.',
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
        eyebrow: 'Texas Commercial Real Estate · Industrial & Warehouse',
        h1: 'Industrial & Warehouse Property for Lease in Texas',
        subhead:
          'Distribution centers, light and heavy manufacturing, flex-industrial, last-mile logistics, cold storage, and bulk warehouse — across all the major Texas industrial submarkets. Whether you need 10,000 SF for a regional service business or 250,000 SF for a Texas distribution hub, CRECO brings vetted options with the right clear height, dock-door count, power, parking, and yard.',
        filterPropertyTypes: ['warehouse', 'industrial', 'flex'],
        filterTransactionType: 'lease',
        demoListings: [
          { id: 'd1', title: 'Northeast San Antonio Warehouse', slug: '#', address: '— San Antonio —', city: 'San Antonio', property_type: 'warehouse', transaction_type: 'lease', sqft: 24000, clear_height: 24, dock_doors: 6, headline: '24,000 SF cross-dock warehouse on I-35 with 6 dock doors and yard', images: null, lease_rate: 8.75, lease_rate_basis: 'NNN' },
          { id: 'd2', title: 'Houston North Industrial', slug: '#', address: '— Houston —', city: 'Houston', property_type: 'warehouse', transaction_type: 'lease', sqft: 60000, clear_height: 32, dock_doors: 12, headline: '60,000 SF Class A distribution near Beltway 8', images: null, lease_rate: 9.25, lease_rate_basis: 'NNN' },
          { id: 'd3', title: 'DFW Flex Industrial', slug: '#', address: '— Arlington —', city: 'Arlington', property_type: 'flex', transaction_type: 'lease', sqft: 18500, clear_height: 18, dock_doors: 3, headline: '18,500 SF flex with showroom front and rear loading', images: null, lease_rate: 12.50, lease_rate_basis: 'NNN' },
        ],
        marketBullets: [
          {
            title: 'Texas is the #1 industrial market in the U.S.',
            body: 'DFW, Houston, and San Antonio rank among the top 10 industrial markets nationally by absorption. The I-35 corridor between San Antonio and Dallas, the Houston Ship Channel, and the Austin/Round Rock chip-and-EV corridor are seeing record industrial demand.',
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
          'Multi-site rollout strategy for distribution and last-mile expansion',
          'Texas-wide reach: I-35, Houston Ship Channel, DFW, El Paso, Austin/Round Rock',
        ],
        faqs: [
          {
            q: 'What does industrial space cost per square foot in Texas?',
            a: 'Industrial lease rates in Texas typically range from $6 to $14 per SF per year on a triple-net (NNN) basis, depending on submarket, building class, and clear height. Older Class C distribution can be found at $5-7/SF NNN; modern Class A bulk distribution in DFW or Houston can exceed $10-12/SF NNN. Class A flex/industrial with office buildout often runs $11-18/SF NNN.',
          },
          {
            q: 'What clear height should I look for?',
            a: 'For typical Texas distribution, 24-32 ft clear height is standard. 18-24 ft is common in older or Class C industrial. Modern bulk distribution centers built since 2018 are often 32-40 ft clear, accommodating 5-6 levels of pallet racking. The right clear height depends on your storage profile — if you stack 4 levels of pallet racking, 24 ft is the minimum; for narrow-aisle automation, 36+ ft is preferred.',
          },
          {
            q: 'How many dock doors do I need?',
            a: 'A common rule of thumb is 1 dock door per 5,000-10,000 SF, but it depends on throughput. High-velocity distribution and cross-dock operations may need 1 door per 2,000-3,000 SF. Service or storage operations may only need 1 door per 15,000-20,000 SF. Always confirm whether dock doors are dock-high (typical) or grade-level (drive-in) — they serve different purposes.',
          },
          {
            q: 'Where are the best Texas industrial submarkets?',
            a: 'San Antonio: Northeast (I-35 corridor), Far Northwest (Loop 1604/I-10). Austin: Northeast, Round Rock, Pflugerville. Houston: Northwest (290/Beltway 8), Northeast (East Sam Houston Tollway), Southwest (290/Hwy 6). DFW: South Dallas, GSW Industrial, Alliance, Arlington, North Fort Worth, Mesquite. We work them all.',
          },
          {
            q: 'Can CRECO help with cold storage or specialized industrial?',
            a: 'Yes. Cold storage, food-grade, hazmat-rated, biotech/lab, manufacturing with heavy power requirements (1000+ amps), and refrigerated distribution all require specialized site selection. We have placed clients into all of these and know which Texas submarkets and buildings actually meet specs vs claim to.',
          },
        ],
        relatedLinks: [
          { href: '/texas-retail-space-for-lease', label: 'Retail Space' },
          { href: '/texas-office-space-for-lease', label: 'Office Space' },
          { href: '/texas-commercial-property-for-sale', label: 'Properties for Sale' },
          { href: '/services/tenant-representation', label: 'Tenant Representation' },
          { href: '/submarkets/northeast', label: 'San Antonio Northeast' },
          { href: '/listings?type=warehouse', label: 'All Industrial Listings' },
        ],
        primaryCta: { href: '/tenant-needs', label: 'Submit Tenant Needs' },
        secondaryCta: { href: 'tel:+12108173443', label: '(210) 817-3443' },
      }}
    />
  );
}
