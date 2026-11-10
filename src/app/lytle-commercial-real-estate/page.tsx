// 30-min ISR — the page embeds live CRECO inventory (table + ItemList + FAQ).
export const revalidate = 1800;

import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { CityHubPage } from '@/components/marketing/CityHubPage';

export const metadata: Metadata = {
  title: 'Lytle Commercial Real Estate | CRECO',
  description:
    'Lytle, TX commercial real estate on the I-35 corridor southwest of San Antonio. Retail and small-bay space for lease at The Mill, 15033 Main St, owned and leased directly by CRECO.',
  keywords: [
    'lytle commercial real estate',
    'lytle tx retail space for lease',
    'lytle texas commercial property',
    'the mill lytle tx',
    '15033 main st lytle',
    'main street lytle retail',
    'atascosa county commercial real estate',
    'i-35 south retail space',
    'small retail space lytle',
    'lytle commercial broker',
  ],
  alternates: { canonical: 'https://www.crecotx.com/lytle-commercial-real-estate' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Lytle Commercial Real Estate | CRECO',
    description:
      'Retail and small-bay commercial space in Lytle, TX, including The Mill at 15033 Main St. CRECO owns the center and leases it directly.',
    url: 'https://www.crecotx.com/lytle-commercial-real-estate',
    type: 'website',
  },
};

export default function LytlePage() {
  return (
    <CityHubPage
      config={{
        canonicalPath: '/lytle-commercial-real-estate',
        sourcesAsOf: 'November 2026',
        city: 'Lytle',
        cityShort: 'Lytle',
        heroEyebrow: 'Texas Commercial Real Estate · Lytle',
        heroTitle: 'Lytle commercial real estate: small-town Main Street retail on the I-35 corridor.',
        heroSubhead:
          "Lytle sits on I-35 about 25 miles southwest of downtown San Antonio, with a working Main Street, a daily-needs customer base and room for small businesses to open their own storefront. CRECO owns and leases The Mill at 15033 Main St, so you deal directly with the owner, and we represent tenants, landlords and buyers across Lytle and the surrounding Atascosa, Medina and Bexar County trade area.",
        quickAnswer:
          'CRECO owns and leases The Mill, a multi-tenant retail center at 15033 Main St in Lytle, TX, with a 650 SF standalone building on the same lot at 15055 Main St. Leases are NNN and pricing is by request. Call (210) 817-3443 or use the form to ask about current availability.',
        marketStats: [
          { label: 'Location', value: 'I-35 South', context: 'about 25 miles southwest of downtown San Antonio' },
          { label: 'Counties', value: 'Three', context: 'Lytle spans Atascosa, Bexar and Medina counties' },
          { label: 'The Mill', value: '±11,750 SF', context: 'CRECO-owned center with established local co-tenants' },
          { label: 'Tenant mix', value: 'Daily needs', context: 'laundry, barbering, dining, boutique and service retail' },
        ],
        marketIntro: [
          "Lytle is a small-town commercial market with an easy I-35 connection. The city straddles Atascosa, Medina and Bexar counties, so its trade area pulls from the southwest San Antonio suburbs as well as the farm-and-ranch communities down the interstate. Commuter traffic and local errands both run through Main Street and the I-35 access road.",
          "Tenants here are mostly independent operators: salons and barbers, tax and insurance offices, coffee and food concepts, boutiques and service businesses. That mix drives repeat weekly traffic, and it favors small, simple spaces with street frontage, parking and a landlord who can make decisions quickly. Big-footprint national retail is thin in town, which leaves room for local businesses to be the destination.",
          "CRECO is both a broker and an owner in Lytle. We own and operate The Mill at 15033 Main St, a multi-tenant center with a 650 SF standalone building on the same lot, so we know first-hand what tenants here ask for and how leases get done. The same team represents tenants looking for a storefront, owners of Lytle and Atascosa County property, and buyers looking at small commercial assets on the I-35 corridor.",
        ],
        servicesIntro: [
          "For tenants, we look at every Lytle option, not only ours. The right spot for a barber or boutique is different from the right spot for a tax office or a food concept. We start from your customer, your hours and your budget, then walk you through Main Street, the I-35 frontage and the nearby towns. Representation is typically paid by the landlord, so it costs you nothing extra.",
          "For owners, we provide leasing campaigns for vacant space, hold or sell analysis, and disposition support. Small multi-tenant centers like those in Lytle are our specialty because we own and run one.",
          "For buyers and investors, we connect Lytle and Atascosa County commercial property to our wider San Antonio and Hill Country network, including owner-users and 1031 exchange buyers.",
        ],
        submarkets: [
          {
            name: 'Main Street (State Highway 132)',
            characterization: 'Local retail + services',
            description: 'The center of Lytle commerce. Main Street is State Highway 132 through town, with small-bay retail, salons, offices and food concepts on street frontage. The Mill at 15033 Main St is here.',
            href: '/15033-main-st-lytle',
          },
          {
            name: 'I-35 Access Road',
            characterization: 'Highway-oriented retail',
            description: 'Frontage and access-road locations near the I-35 exit, aimed at commuters and passing traffic: fast food, convenience, nails and service retail.',
          },
          {
            name: 'McDonald Street',
            characterization: 'Neighborhood retail',
            description: 'A corridor of small centers connecting the I-35 area to downtown, with insurance, beauty and service tenants.',
          },
          {
            name: 'Highway 132 toward Devine',
            characterization: 'Local service commercial',
            description: 'State Highway 132 as it leaves town toward Devine, with small offices, bakeries and service businesses serving the surrounding area.',
          },
          {
            name: 'Atascosa & Medina County Towns',
            characterization: 'Regional trade area',
            description: 'Devine, Poteet, Pleasanton, Jourdanton, Castroville and Somerset share customers and tenants with Lytle, and we work all of them.',
          },
        ],
        whyBullets: [
          'We own and lease The Mill at 15033 Main St, so we deal with Lytle tenants as the decision-maker',
          'Texas-wide broker practice with San Antonio and Hill Country reach',
          'Representation for tenants, landlords and owners, and buyers or investors',
          'Tenant representation is typically paid by the landlord',
          'Small-space specialists: from a 650 SF storefront to multi-tenant centers',
          'Direct access: every engagement is handled personally by the CRECO team',
        ],
        relatedInsights: [
          {
            slug: 'texas-retail-leasing-fundamentals-2026',
            category: 'Market Outlook',
            title: "Texas Retail Leasing Fundamentals 2026: What Strong Centers Have, What Weak Centers Don't",
          },
          {
            slug: 'texas-commercial-real-estate-outlook-2026',
            category: 'Market Outlook',
            title: 'Texas Commercial Real Estate Outlook: What Owners and Tenants Should Watch in 2026',
          },
          {
            slug: 'multi-property-owner-strategy',
            category: 'Owner Strategy',
            title: 'Multi-Property Owner Strategy: When to Hold, When to Sell, When to Reposition Your Texas Commercial Real Estate',
          },
        ],
        propertyLinks: [
          { label: 'The Mill, 15033 Main St', href: '/15033-main-st-lytle', description: "CRECO's multi-tenant retail center on Lytle's Main Street, with a 650 SF standalone building available." },
          { label: 'San Antonio retail space', href: '/san-antonio-retail-space', description: 'Retail across San Antonio, including the southwest and I-35 South corridors toward Lytle.' },
          { label: 'San Antonio commercial real estate', href: '/san-antonio-commercial-real-estate', description: 'The metro hub: submarkets, services and live inventory.' },
          { label: 'Fair Oaks Ranch commercial', href: '/fair-oaks-ranch-commercial-real-estate', description: 'Our other owner-operated center, 8000 Fair Oaks Pkwy in Fair Oaks Ranch.' },
        ],
        faqs: [
          {
            q: 'What is The Mill in Lytle, TX?',
            a: 'The Mill is a multi-tenant retail center at 15033 Main St in Lytle, TX, about 11,750 SF with established local co-tenants. CRECO owns and leases it directly. A 650 SF standalone building on the same lot, at 15055 Main St, is also leased by CRECO.',
          },
          {
            q: 'How much is retail rent in Lytle?',
            a: 'Leases at The Mill are NNN (triple net) and pricing is quoted by space. Call CRECO at (210) 817-3443 or use the form for current rates and availability.',
          },
          {
            q: 'What kinds of businesses lease space in Lytle?',
            a: 'Mostly independent local operators: laundry and dry cleaning, barbering and salons, dining, boutiques, tax and insurance offices, and service businesses. The daily-needs mix brings repeat weekly traffic.',
          },
        ],
      }}
    />
  );
}
