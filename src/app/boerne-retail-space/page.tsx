// 30-min ISR — the page embeds live CRECO inventory (table + ItemList + FAQ).
export const revalidate = 1800;

import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { CityAssetPage } from '@/components/marketing/CityAssetPage';

export const metadata: Metadata = {
  title: "Boerne Retail Space for Lease | CRECO",
  description:
    "Boerne retail space for lease — Main Street storefronts, I-10 corridor centers, and Highway 46 sites, with tenant and landlord representation from CRECO.",
  keywords: [
    "boerne retail space for lease",
    "boerne tx retail space",
    "boerne main street retail",
    "boerne storefront for lease",
    "boerne i-10 retail",
    "boerne restaurant space for lease",
    "boerne strip center",
    "boerne commercial lease",
    "kendall county retail space",
    "boerne retail broker",
    "hill country retail space",
  ],
  alternates: { canonical: 'https://www.crecotx.com/boerne-retail-space' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: "Boerne Retail Space for Lease | CRECO",
    description:
      "Destination retail on historic Main Street, daily-needs and chain retail on I-10, and an emerging Highway 46 corridor. Boerne retail for lease — tenant and landlord rep from a Hill Country broker.",
    url: 'https://www.crecotx.com/boerne-retail-space',
    type: 'website',
  },
};

export default function BoerneRetailSpacePage() {
  return (
    <CityAssetPage
      config={{
        sourcesAsOf: 'November 2026',
        canonicalPath: '/boerne-retail-space',
        city: "Boerne",
        asset: "retail",
        heroEyebrow: "Hill Country Retail · Boerne",
        quickAnswer:
          "Boerne retail splits into three corridors that rarely compete: historic Main Street for destination dining and boutiques, the I-10 corridor for daily-needs and national chains, and Highway 46 for newer suburban-format centers. Space is limited, well-located storefronts lease quickly, and the right corridor depends on the concept.",
        stats: [
            { label: "Retail corridors", value: "Three", note: "Main Street · I-10 · Highway 46" },
            { label: "Main Street", value: "Destination", note: "walkable, tourism-driven, premium rents" },
            { label: "I-10 corridor", value: "Daily needs", note: "H-E-B and Walmart anchored" },
            { label: "Highway 46", value: "Emerging", note: "follows rooftop growth east and west" },
            { label: "Available supply", value: "Limited", note: "small inventory, quick absorption" },
            { label: "Typical deal", value: "NNN", note: "expect taxes, insurance, CAM on top of base rent" },
          ],
        keyTakeaways: [
            "Boerne is three retail markets in one town. A destination restaurant belongs on Main Street; a drive-thru concept belongs on I-10. Choosing the wrong corridor costs more than any rent difference.",
            "Inventory is thin. Main Street storefronts and well-positioned I-10 bays seldom sit, so the best space is often found through relationships before it is ever listed.",
            "Growth is pushing retail demand along Highway 46 and the I-10 frontage as residential rooftops expand across Kendall County.",
            "Boerne draws from a wider trade area than its city limits, including Fair Oaks Ranch and the Hill Country, which supports services, dining, and specialty concepts that need affluent households.",
          ],
        marketContext: [
            "Boerne has one of the more distinctive retail markets in the San Antonio region. Main Street is a true destination district, with restaurants, boutiques, galleries, and events that draw visitors from San Antonio and across the Hill Country. The I-10 corridor, anchored by H-E-B and Walmart, handles daily-needs retail and national chains for a fast-growing trade area.",
            "Because the corridors serve different customers, tenants do not trade one off against the other so much as they pick the one that fits the concept. Main Street rewards character and foot traffic. I-10 rewards visibility, parking, and drive-thru access. Highway 46 rewards being early to new rooftops.",
            "Supply is the common constraint. There is not much speculative retail in Boerne, and the strongest locations tend to lease before they reach the open market. For tenants, that makes market knowledge and speed the advantage. For owners, it supports steady leasing when the space is positioned and priced for the right corridor.",
          ],
        servicesIntro: [
            "CRECO is headquartered a few minutes away in Fair Oaks Ranch, in a retail and executive-suite center we own and operate. We lease and manage retail in this trade area ourselves, which shapes how we advise tenants and owners in Boerne.",
            "For tenants and franchisees, we match the concept to the corridor, tour the realistic options, and negotiate rent, tenant improvements, and lease terms. Tenant representation is typically paid by the landlord, so there is usually no cost to you.",
            "For Boerne retail owners, we handle leasing campaigns, pricing, and disposition, and we can connect a sale to a wider buyer pool across San Antonio and Texas.",
          ],
        submarkets: [
            { name: "Main Street / Downtown Boerne", characterization: "Destination dining and boutiques", description: "Historic Hill Country Main Street. Restaurants, galleries, and lifestyle retail with real pedestrian traffic and a rent premium to match." },
            { name: "I-10 Corridor", characterization: "Daily needs and national chains", description: "The high-volume spine anchored by H-E-B and Walmart. Fast-casual, services, and chain tenants that need visibility and parking." },
            { name: "Highway 46", characterization: "Emerging suburban retail", description: "Growth corridor where commercial demand follows new homes east toward Bulverde and west toward Fredericksburg." },
            { name: "Boerne / Fair Oaks Ranch border", characterization: "Cross-market trade area", description: "Where Boerne traffic meets Fair Oaks Ranch households. Suited to multi-tenant retail and services.", href: "/fair-oaks-ranch-retail-space" },
          ],
        whyBullets: [
            "Headquartered in the Hill Country, with an owned and operated center in the neighboring market",
            "Corridor-by-corridor guidance: Main Street, I-10, and Highway 46",
            "Tenant, landlord, and investment representation under one roof",
            "Access to space before it is publicly listed",
            "Direct access to the broker handling your deal",
          ],
        listingsLink: { label: "See Boerne retail listings →", href: "/listings?q=Boerne&type=retail" },
        cityHubLink: { label: "Boerne market overview", href: "/boerne-commercial-real-estate" },
        breadcrumbs: [
            { label: "Texas CRE", href: "/markets" },
            { label: "Boerne", href: "/boerne-commercial-real-estate" },
            { label: "Retail space" },
          ],
      }}
    />
  );
}
