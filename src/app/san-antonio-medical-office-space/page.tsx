// 30-min ISR — the page embeds live CRECO inventory (table + ItemList + FAQ).
export const revalidate = 1800;

import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { CityAssetPage } from '@/components/marketing/CityAssetPage';

export const metadata: Metadata = {
  title: "San Antonio Medical Office Space for Lease | CRECO",
  description:
    "San Antonio medical office space for lease — South Texas Medical Center, Stone Oak, and suburban clinics, with tenant and landlord rep from CRECO.",
  keywords: [
    "san antonio medical office space for lease",
    "medical office space san antonio",
    "medical center san antonio office lease",
    "dental office space san antonio",
    "san antonio medical office building",
    "medical office san antonio for rent",
    "stone oak medical office",
    "san antonio clinic space",
    "medical tenant rep san antonio",
    "medical office broker san antonio",
  ],
  alternates: { canonical: 'https://www.crecotx.com/san-antonio-medical-office-space' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: "San Antonio Medical Office Space for Lease | CRECO",
    description:
      "Medical and dental office space across the South Texas Medical Center and growing suburban corridors. Tenant rep for practices, landlord rep for medical buildings.",
    url: 'https://www.crecotx.com/san-antonio-medical-office-space',
    type: 'website',
  },
};

export default function SanAntonioMedicalOfficeSpacePage() {
  return (
    <CityAssetPage
      config={{
        sourcesAsOf: 'November 2026',
        canonicalPath: '/san-antonio-medical-office-space',
        city: "San Antonio",
        asset: "medical office",
        heroEyebrow: "Texas Medical Office · San Antonio · HQ",
        quickAnswer:
          "San Antonio’s medical office market is anchored by the South Texas Medical Center, one of the largest medical concentrations in the country, and by suburban clinics following population growth in the northwest, north, and I-35 corridors. Vacancy is lower than general office, and buildout cost and timing often matter more than rent.",
        stats: [
            { label: "Medical office vacancy", value: "~5-9%", note: "tighter than general office, directional" },
            { label: "Core hub", value: "South Texas Medical Center", note: "hospitals, research, specialists" },
            { label: "Suburban growth", value: "Northwest · North · I-35", note: "clinics follow rooftops" },
            { label: "Buildout", value: "Key cost", note: "plumbing, imaging, and shielding drive TI" },
            { label: "Lease structure", value: "NNN or modified gross", note: "varies by building class" },
            { label: "Typical tenant", value: "Practices", note: "primary care, dental, specialty, imaging" },
          ],
        keyTakeaways: [
            "Medical office is tighter than general office in San Antonio, and the best-located space near hospitals leases early.",
            "Tenant improvement terms often matter more than the base rent, because medical buildouts are expensive.",
            "Suburban clinics are expanding along the growth corridors, and primary care and dental often prefer ground-floor, high-visibility space.",
            "Many general office or retail spaces can convert to medical use if the building, parking, and landlord allow it.",
          ],
        marketContext: [
            "San Antonio has one of the largest medical employment bases in the country, centered on the South Texas Medical Center. Specialists, imaging groups, and ancillary practices cluster around the hospitals, which keeps nearby medical office buildings competitive.",
            "As the metro grows, primary care, urgent care, dental, and specialty groups follow rooftops into Stone Oak, the northwest corridor, and the I-35 northeast and southwest growth paths. These practices often prefer easy access, visible signage, and parking close to the door.",
            "For a practice, the lease economics depend on what the landlord will contribute to the buildout and how long the term runs. A broker who understands medical plumbing, power, and compliance requirements can prevent expensive surprises, and can identify which spaces are already built out.",
          ],
        servicesIntro: [
            "CRECO is headquartered in the San Antonio region and represents tenants, landlords, and investors. For medical tenants, we define the program, survey buildings, and negotiate rent, improvement allowances, and term.",
            "For owners of medical buildings, we market vacancies to practice groups, advise on pricing, and handle sale or recapitalization when the time is right.",
          ],
        submarkets: [
            { name: "South Texas Medical Center", characterization: "Hospital-adjacent", description: "The densest concentration of specialists and medical office buildings, with the tightest space." },
            { name: "Stone Oak / North", characterization: "Affluent suburban clinics", description: "Primary care, dental, and specialty practices serving a high-income trade area." },
            { name: "Northwest / Alamo Ranch", characterization: "Growth corridor", description: "New clinics following rooftop growth along US-90 and the 1604 loop." },
            { name: "Hill Country (Boerne / Fair Oaks Ranch)", characterization: "Small-suite medical", description: "Smaller practices serving affluent Hill Country households.", href: "/boerne-office-space" },
          ],
        whyBullets: [
            "Experience with medical buildouts and allowance negotiation",
            "Coverage from the Medical Center to the Hill Country",
            "Tenant, landlord, and investment representation under one roof",
            "Direct access to the broker handling your deal",
          ],
        listingsLink: { label: "See San Antonio medical office listings →", href: "/listings?q=San%20Antonio&type=medical%20office" },
        cityHubLink: { label: "San Antonio market overview", href: "/san-antonio-commercial-real-estate" },
        breadcrumbs: [
            { label: "Texas CRE", href: "/markets" },
            { label: "San Antonio", href: "/san-antonio-commercial-real-estate" },
            { label: "Medical office" },
          ],
      }}
    />
  );
}
