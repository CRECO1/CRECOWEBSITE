// 30-min ISR — the page embeds live CRECO inventory (table + ItemList + FAQ).
export const revalidate = 1800;

import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { CityAssetPage } from '@/components/marketing/CityAssetPage';

export const metadata: Metadata = {
  title: "Fair Oaks Ranch Retail Space for Lease | CRECO",
  description:
    "Fair Oaks Ranch retail space for lease — new and existing retail on Fair Oaks Pkwy and Dietz Elkhorn Rd, from the broker headquartered in Fair Oaks Ranch.",
  keywords: [
    "fair oaks ranch retail space",
    "fair oaks ranch retail space for lease",
    "fair oaks ranch tx commercial lease",
    "fair oaks pkwy retail",
    "dietz elkhorn retail",
    "fair oaks ranch restaurant space",
    "fair oaks ranch shopping center",
    "fair oaks ranch storefront",
    "fair oaks ranch commercial broker",
    "elkhorn point fair oaks ranch",
    "hill country retail space",
  ],
  alternates: { canonical: 'https://www.crecotx.com/fair-oaks-ranch-retail-space' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: "Fair Oaks Ranch Retail Space for Lease | CRECO",
    description:
      "Retail space inside one of the highest-income communities in Texas, with limited commercial supply. CRECO owns and leases retail in Fair Oaks Ranch and is developing Elkhorn Point.",
    url: 'https://www.crecotx.com/fair-oaks-ranch-retail-space',
    type: 'website',
  },
};

export default function FairOaksRanchRetailSpacePage() {
  return (
    <CityAssetPage
      config={{
        sourcesAsOf: 'November 2026',
        canonicalPath: '/fair-oaks-ranch-retail-space',
        city: "Fair Oaks Ranch",
        asset: "retail",
        heroEyebrow: "Hill Country Retail · Fair Oaks Ranch",
        quickAnswer:
          "Fair Oaks Ranch has about 11,000 residents with a median household income around $174,000 and very little retail inside the city limits. Tenants gain access to affluent households who currently drive to Boerne or San Antonio for dining, services, and fitness. CRECO owns and leases retail here.",
        stats: [
            { label: "Residents", value: "~11,000", note: "U.S. Census Bureau estimate" },
            { label: "Median household income", value: "~$174K", note: "about double the Texas median (ACS)" },
            { label: "Median age", value: "~46", note: "established households, high spending power" },
            { label: "Retail supply", value: "Limited", note: "few centers inside the city limits" },
            { label: "Leakage", value: "High", note: "residents shop in Boerne and San Antonio" },
            { label: "Main corridors", value: "Fair Oaks Pkwy · Dietz Elkhorn", note: "close to I-10" },
          ],
        keyTakeaways: [
            "Fair Oaks Ranch has strong household incomes and little local retail. That gap is the opportunity for dining, services, fitness, and daily-needs tenants.",
            "Retail inventory is small, with only a handful of centers inside the city limits, so timing matters.",
            "Fair Oaks Pkwy and Dietz Elkhorn Rd are the two corridors that connect the community to I-10 and Boerne.",
            "Tenants reach a high-income local customer base with little direct competition nearby.",
          ],
        marketContext: [
            "Fair Oaks Ranch is a master-planned, large-lot community with household incomes among the highest in the San Antonio region. For years its retail has lagged its demographics, so residents drive down I-10 toward The Rim and 1604, or north into Boerne, for most dining, fitness, and services.",
            "That is why small, well-merchandised retail does well here. A restaurant, fitness or wellness studio, medical or dental user, or professional service can draw nearby households that would otherwise leave the city. Boutique studio concepts in particular are few.",
            "Supply is tight, so tenants usually have a small number of real options. CRECO operates one center and is developing another.",
          ],
        servicesIntro: [
            "CRECO is headquartered in Fair Oaks Ranch. We own and operate the retail and executive suite center at 8000 Fair Oaks Pkwy and are developing Elkhorn Point on Dietz Elkhorn Rd, so we can speak to this market as an owner as well as a broker.",
            "For tenants, we match the concept to the right center, explain what the trade area supports, and negotiate terms. For other owners and investors in the area, we provide leasing, pricing, and sale advice.",
          ],
        submarkets: [
            { name: "8000 Fair Oaks Pkwy", characterization: "CRECO-owned retail and suites", description: "A mixed-use center with retail bays and executive suite buildings on the main community corridor.", href: "/8000-fair-oaks-pkwy" },
            { name: "Elkhorn Point (Dietz Elkhorn Rd)", characterization: "New retail, pre-leasing", description: "A CRECO development of about 20,000 SF in two buildings, divisible and available as built-to-suit.", href: "https://elkhornpoint.com/?utm_source=crecotx&utm_medium=referral&utm_campaign=cross-site&utm_content=fair-oaks-ranch-retail-space" },
            { name: "Fair Oaks Pkwy corridor", characterization: "Community main street", description: "The route most residents use daily, with the highest local traffic." },
            { name: "Boerne (north)", characterization: "Adjacent destination market", description: "A larger trade area a few minutes north, with its own retail corridors.", href: "/boerne-retail-space" },
          ],
        whyBullets: [
            "Headquartered in Fair Oaks Ranch, with a center we own and operate",
            "Developing Elkhorn Point, so we know what is coming to market",
            "Verified demographic data from the U.S. Census Bureau",
            "Tenant, landlord, and investment representation under one roof",
            "Direct access to the broker handling your deal",
          ],
        listingsLink: { label: "See Fair Oaks Ranch listings →", href: "/listings?q=Fair%20Oaks%20Ranch&type=retail" },
        cityHubLink: { label: "Fair Oaks Ranch market overview", href: "/fair-oaks-ranch-commercial-real-estate" },
        breadcrumbs: [
            { label: "Texas CRE", href: "/markets" },
            { label: "Fair Oaks Ranch", href: "/fair-oaks-ranch-commercial-real-estate" },
            { label: "Retail space" },
          ],
      }}
    />
  );
}
