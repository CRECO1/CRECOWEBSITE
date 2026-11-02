// 30-min ISR — the page embeds live CRECO inventory (table + ItemList + FAQ).
export const revalidate = 1800;

import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { CityAssetPage } from '@/components/marketing/CityAssetPage';

export const metadata: Metadata = {
  title: "Boerne Office Space for Lease | CRECO",
  description:
    "Boerne office space for lease — professional, medical, and executive suites near Main Street and the I-10 corridor, with tenant and landlord rep from CRECO.",
  keywords: [
    "boerne office space for lease",
    "boerne tx office space",
    "boerne executive suites",
    "boerne professional office",
    "boerne medical office",
    "kendall county office space",
    "boerne office for rent",
    "boerne commercial lease",
    "hill country office space",
    "boerne office broker",
  ],
  alternates: { canonical: 'https://www.crecotx.com/boerne-office-space' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: "Boerne Office Space for Lease | CRECO",
    description:
      "Professional, medical, and executive office space in Boerne and Kendall County. Small suites for firms that want to work near where their clients live. Tenant and landlord rep from a Hill Country broker.",
    url: 'https://www.crecotx.com/boerne-office-space',
    type: 'website',
  },
};

export default function BoerneOfficeSpacePage() {
  return (
    <CityAssetPage
      config={{
        sourcesAsOf: 'November 2026',
        canonicalPath: '/boerne-office-space',
        city: "Boerne",
        asset: "office",
        heroEyebrow: "Hill Country Office · Boerne",
        quickAnswer:
          "Boerne office space is mostly small and suite-scale: professional services, medical and dental, financial, and real estate firms serving Kendall County clients. Inventory is limited, and demand comes from businesses that prefer to operate close to where their clients live rather than commuting into San Antonio.",
        stats: [
            { label: "Typical user", value: "Small firms", note: "suites from a few hundred to several thousand SF" },
            { label: "Demand drivers", value: "Local clients", note: "professional, medical, financial, real estate" },
            { label: "Supply", value: "Limited", note: "few large blocks of space" },
            { label: "Common structure", value: "Modified gross", note: "some suites lease fully serviced" },
            { label: "Key corridors", value: "Main St · I-10 · Hwy 46", note: "visibility and parking vary widely" },
            { label: "Commute alternative", value: "San Antonio", note: "Boerne offices compete on convenience" },
          ],
        keyTakeaways: [
            "Boerne office demand is local. Firms choose it so they can be near clients and staff who live in Boerne, Fair Oaks Ranch, and the surrounding Hill Country.",
            "Most space is suite-scale. Large single-floor requirements are rare, so tenants needing more than a few thousand square feet should start early.",
            "Medical and dental users are an active segment, and the buildout in a space often matters as much as the rent.",
            "Executive suites and small flexible spaces suit new practices and satellite offices that do not want a long commitment.",
          ],
        marketContext: [
            "Boerne is not a conventional office market. There is no concentration of large office towers; instead, the market is built from small professional buildings, converted properties, and suites in mixed-use centers. Users are attorneys, accountants, insurance and financial advisors, real estate and title firms, and medical and dental practices.",
            "Affluent households across Boerne and Fair Oaks Ranch support this client-facing demand, and many business owners want a short drive to the office. That keeps small, well-located suites in demand even when larger metro office markets are soft.",
            "Because inventory is scarce and varied, a tenant is best served by a broker who knows which buildings have space, what condition it is in, and how landlords price it. Terms, buildout allowances, and parking differ enough from building to building that a side-by-side comparison saves real money.",
          ],
        servicesIntro: [
            "CRECO owns and operates executive suite space in neighboring Fair Oaks Ranch, so we understand small-suite leasing from the landlord side as well as the tenant side.",
            "For tenants, we define the requirement, survey the options in Boerne and the surrounding area, and negotiate rent, improvements, and term. For owners of Boerne office property, we market vacancies, price to the market, and advise on hold, lease, or sell decisions.",
          ],
        submarkets: [
            { name: "Downtown / Main Street", characterization: "Character offices", description: "Converted buildings and small professional space near the historic core. Good for client-facing firms that value the address." },
            { name: "I-10 Corridor", characterization: "Visibility and access", description: "Suites and small buildings with easy highway access and parking, suited to medical and service users." },
            { name: "Highway 46", characterization: "Newer small-format space", description: "Newer professional and medical buildings following residential growth." },
            { name: "Fair Oaks Ranch (nearby)", characterization: "Executive suites", description: "Executive suite buildings a short drive south, including CRECO’s own center.", href: "/fair-oaks-ranch-office-space" },
          ],
        whyBullets: [
            "We own and lease executive suite space in the neighboring market",
            "Small-suite and medical buildout experience",
            "Tenant, landlord, and investment representation under one roof",
            "Knowledge of which Boerne buildings actually have space",
            "Direct access to the broker handling your deal",
          ],
        listingsLink: { label: "See Boerne office listings →", href: "/listings?q=Boerne&type=office" },
        cityHubLink: { label: "Boerne market overview", href: "/boerne-commercial-real-estate" },
        breadcrumbs: [
            { label: "Texas CRE", href: "/markets" },
            { label: "Boerne", href: "/boerne-commercial-real-estate" },
            { label: "Office space" },
          ],
      }}
    />
  );
}
