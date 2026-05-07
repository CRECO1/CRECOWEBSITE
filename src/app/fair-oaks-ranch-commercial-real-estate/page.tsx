import type { Metadata } from 'next';
import { CityHubPage } from '@/components/marketing/CityHubPage';

export const metadata: Metadata = {
  title: 'Fair Oaks Ranch Commercial Real Estate | Retail, Office, Land | CRECO',
  description:
    'Fair Oaks Ranch commercial real estate — retail, office, and land for lease and sale. CRECO is headquartered at 8000 Fair Oaks Pkwy in Fair Oaks Ranch, where we own and operate the mixed-use commercial center, with the on-the-ground market knowledge to back tenants, owners, and investors.',
  keywords: [
    'fair oaks ranch commercial real estate',
    'fair oaks ranch retail space',
    'fair oaks ranch commercial property',
    'fair oaks ranch commercial broker',
    'commercial property for lease fair oaks ranch',
    'commercial property for sale fair oaks ranch',
    'fair oaks parkway retail',
    'i-10 commercial real estate',
    'dominion commercial real estate',
    'fair oaks ranch tx commercial',
  ],
  alternates: { canonical: 'https://www.crecotx.com/fair-oaks-ranch-commercial-real-estate' },
  openGraph: {
    title: 'Fair Oaks Ranch Commercial Real Estate | CRECO',
    description:
      'Retail, office, and land in Fair Oaks Ranch. CRECO is invested locally and knows the market — from I-10 frontage to Fair Oaks Pkwy and the Dominion-adjacent corridor.',
    url: 'https://www.crecotx.com/fair-oaks-ranch-commercial-real-estate',
    type: 'website',
  },
};

export default function FairOaksRanchPage() {
  return (
    <CityHubPage
      config={{
        city: 'Fair Oaks Ranch',
        cityShort: 'Fair Oaks Ranch',
        heroEyebrow: 'Texas Commercial Real Estate · Fair Oaks Ranch',
        heroTitle: 'Fair Oaks Ranch commercial real estate — and we have the local conviction to prove it.',
        heroSubhead:
          "Fair Oaks Ranch is home base — CRECO is headquartered at 8000 Fair Oaks Pkwy, the mixed-use commercial center we own and operate. A 4-bay retail center plus two two-story executive office suite buildings, in a market the rest of Texas commercial brokerage has historically under-served. If you're a tenant scouting Fair Oaks Ranch space, an owner repositioning a property, or an investor looking at the I-10 corridor, this is where to start.",
        marketStats: [
          { label: 'Median household income', value: '$130K+', context: 'one of the highest-income suburbs in Texas' },
          { label: 'Population growth', value: 'High', context: 'driven by master-planned community expansion' },
          { label: 'Commercial inventory', value: 'Limited', context: '— meaning leasing leverage and disciplined supply' },
          { label: 'I-10 corridor access', value: 'Direct', context: 'between San Antonio and the Hill Country' },
        ],
        marketIntro: [
          "Fair Oaks Ranch is one of the most distinctive commercial real estate submarkets in the greater San Antonio area. The residential side of Fair Oaks Ranch is characterized by very affluent demographics — household incomes among the highest in Texas, large-lot residential, and a master-planned community fabric that has been growing steadily for two decades. That residential strength has not, until recently, been matched by commercial development at the same caliber.",
          "That mismatch is what makes Fair Oaks Ranch interesting for retail in 2026. The trade area's spending power is leaving Fair Oaks Ranch every day for retail, dining, and services — going down I-10 to The Rim and 1604 corridor to the south, or up to Boerne to the north. Bringing that spending back into Fair Oaks Ranch with the right retail product is the thesis CRECO is acting on — most visibly at 8000 Fair Oaks Pkwy, where we own and lease a 4-bay retail center alongside two executive office suite buildings, but also through the broker work we do for tenants and owners across the submarket.",
          "Beyond retail, Fair Oaks Ranch has growing office demand from professional services that want to operate where their clients live, modest industrial demand from contractor and service businesses, and a recurring stream of land transactions tied to the residential growth pipeline. CRECO covers all of it.",
        ],
        servicesIntro: [
          "We don't treat Fair Oaks Ranch as an afterthought to a generic San Antonio commercial real estate practice. CRECO owns and operates the mixed-use commercial center at 8000 Fair Oaks Pkwy — and that on-the-ground commitment shapes how we work with tenant, owner, and investor clients here.",
          "For tenants — restaurants, retail concepts, professional services, fitness, medical, and specialty operators — we underwrite Fair Oaks Ranch sites against your specific concept, your trade area, and your operating model. We know the I-10 frontage submarkets, the Fair Oaks Pkwy corridor, and the Dominion-adjacent options, and we're candid about which makes sense for which uses.",
          "For owners and investors, we provide the same rigorous broker work we bring to every Texas market: hold/sell/reposition strategy on existing assets, off-market deal flow for acquisitions, leasing campaigns to drive occupancy, and disposition coordination when it's time to sell.",
        ],
        submarkets: [
          {
            name: 'Fair Oaks Pkwy Corridor',
            characterization: 'Retail + executive office',
            description: "The Fair Oaks Pkwy spine — anchor of the residential community and the natural location for community-serving retail and professional services. CRECO's mixed-use center at 8000 Fair Oaks Pkwy sits here, with retail bays + executive office suites.",
          },
          {
            name: 'I-10 Frontage',
            characterization: 'Highway-visible commercial',
            description: 'I-10 frontage between Boerne and San Antonio — high traffic counts, regional retail visibility, and the corridor most Fair Oaks Ranch commercial real estate is benchmarked against.',
          },
          {
            name: 'Dominion-Adjacent',
            characterization: 'Class A retail + service',
            description: 'The high-end retail and service submarket adjacent to The Dominion. Premium positioning, premium demographics, established commercial fabric.',
          },
          {
            name: 'Old Fredericksburg Rd / 1604',
            characterization: 'Suburban retail',
            description: "The 1604/Old Fredericksburg corridor connecting Fair Oaks Ranch to the broader San Antonio suburban retail market. Strong demographics, established tenant mix.",
          },
          {
            name: 'Northern Approach to Boerne',
            characterization: 'Growth corridor',
            description: 'The corridor heading north into Boerne — emerging commercial, residential growth pipeline, and the bridge between Fair Oaks Ranch and the larger Boerne trade area.',
          },
          {
            name: 'Land + Development',
            characterization: 'Ground-up opportunity',
            description: 'Development-ready land in and around Fair Oaks Ranch — retail pads, office pads, and mixed-use sites tied to the residential growth pipeline.',
          },
        ],
        whyBullets: [
          'Local conviction — CRECO owns and operates the mixed-use center at 8000 Fair Oaks Pkwy',
          'Texas-wide reach — Fair Oaks Ranch deals connect to our broader San Antonio + Hill Country network',
          'Tenant rep for restaurants, retail, professional services, and executive suite tenants — landlord pays our commission',
          'Owner services and asset strategy for Fair Oaks Ranch property owners',
          'Off-market deal flow on land, retail, and owner-user opportunities',
          'Direct broker access — every engagement led by a senior CRECO broker',
        ],
        relatedInsights: [
          {
            slug: 'texas-retail-leasing-fundamentals-2026',
            category: 'Market Outlook',
            title: 'Texas Retail Leasing Fundamentals 2026: What Strong Centers Have, What Weak Centers Don\'t',
          },
          {
            slug: 'lease-vs-buy-texas-business',
            category: 'Tenant Strategy',
            title: 'Lease vs Buy: How Texas Business Owners Should Think About Their Commercial Real Estate',
          },
          {
            slug: 'texas-commercial-real-estate-outlook-2026',
            category: 'Market Outlook',
            title: 'Texas Commercial Real Estate Outlook: What Owners and Tenants Should Watch in 2026',
          },
        ],
        propertyLinks: [
          { label: 'Retail space for lease', href: '/texas-retail-space-for-lease', description: 'Retail in Fair Oaks Ranch and across Texas — strip centers, end-caps with drive-thru, restaurants, and pad sites.' },
          { label: 'Office space for lease', href: '/texas-office-space-for-lease', description: 'Professional services office in Fair Oaks Ranch and the broader I-10 corridor.' },
          { label: '8000 Fair Oaks Pkwy', href: '/8000-fair-oaks-pkwy', description: "CRECO's mixed-use center at 8000 Fair Oaks Pkwy — 4 retail bays + two executive suite buildings, now leasing." },
          { label: 'Boerne commercial real estate', href: '/boerne-commercial-real-estate', description: 'The neighboring Boerne market — Hill Country gateway, strong I-10 commercial corridor, growing demographics.' },
        ],
      }}
    />
  );
}
