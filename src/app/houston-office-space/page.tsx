// 30-min ISR — the page embeds live CRECO inventory (table + ItemList + FAQ).
export const revalidate = 1800;


import type { Metadata } from 'next';
import { CityAssetPage } from '@/components/marketing/CityAssetPage';

export const metadata: Metadata = {
  title: 'Houston Office Space for Lease | CRECO',
  description:
    'Houston office space for lease — Class A downtown and in Uptown/Galleria, the Energy Corridor and Westchase, and corporate campuses in The Woodlands.',
  keywords: [
    'houston office space for lease',
    'office space houston',
    'downtown houston office',
    'galleria office space houston',
    'energy corridor office space',
    'westchase office houston',
    'the woodlands office space',
    'sugar land office space',
    'houston office market',
    'houston office vacancy',
    'houston office sublease',
    'houston office rent',
    'houston office broker',
    'houston tenant representation',
  ],
  alternates: { canonical: 'https://www.crecotx.com/houston-office-space' },
  openGraph: {
    title: 'Houston Office Space for Lease | CRECO',
    description:
      'Trophy Class A downtown and Uptown/Galleria, energy tenancy in the Energy Corridor and Westchase, corporate campuses in The Woodlands. One of the most tenant-favorable office markets in the US — tenant rep by submarket.',
    url: 'https://www.crecotx.com/houston-office-space',
    type: 'website',
  },
};

export default function HoustonOfficeSpacePage() {
  return (
    <CityAssetPage
      config={{
        canonicalPath: '/houston-office-space',
        city: 'Houston',
        asset: 'office',
        heroEyebrow: 'Texas Office Market · Houston',
        quickAnswer:
          'Houston is one of the most tenant-favorable office markets in the US: metro vacancy sits in the mid-20s%+ with a large sublease overhang, so even trophy Class A comes with concessions that were unthinkable a decade ago. Flight-to-quality is the whole game — new, amenitized buildings hold tenancy while commodity space carries 30%+ vacancy and repositioning pressure.',
        stats: [
          { label: 'Metro vacancy',            value: '~25%+',        note: 'among the highest of major US metros' },
          { label: 'Trophy Class A vacancy',   value: '~15-20%',      note: 'holds far better than the average' },
          { label: 'Trophy Class A asking',    value: '$35-50+/SF',   note: 'downtown + Galleria highrises' },
          { label: 'Class B vacancy',          value: '~30%+',        note: 'deep repositioning / conversion pressure' },
          { label: 'Class B asking',           value: '$20-28/SF',    note: 'realized rates well below ask' },
          { label: 'TI on Class A (10yr)',     value: '$70-110/SF',   note: 'among the deepest concessions in TX' },
          { label: 'Free rent (10yr Class A)', value: '8-15 months',  note: 'reflects the tenant-favorable cycle' },
          { label: 'Sublease availability',    value: 'Elevated',     note: 'energy-driven; often beats direct deals' },
        ],
        keyTakeaways: [
          'Houston office is a tenant\'s market by almost any measure — vacancy in the mid-20s%+, a persistent sublease overhang, and concession packages (TI + free rent) among the deepest in Texas.',
          'Flight-to-quality is the defining dynamic. New, amenitized trophy buildings hold tenancy and even push rents; commodity Class A and Class B carry 30%+ vacancy and mounting reposition-or-convert pressure.',
          'The market is energy-cycle sensitive, and it is concentrated in specific submarkets — the Energy Corridor and Westchase track oil-and-gas fortunes most directly, which shows up in their vacancy and concession depth.',
          'The Woodlands and other master-planned north submarkets (near the ExxonMobil / Springwoods corporate cluster) are amenity-rich and comparatively resilient — a different tenant experience than the older highrise stock.',
          'For tenants, sublease inventory is a real opportunity: for many 5-25K SF requirements, a quality sublease with term remaining beats a direct deal on economics. The catch is term-remaining and furniture/condition — worth a broker who tracks the live sublease set.',
        ],
        marketContext: [
          'Houston has carried one of the highest office vacancy rates among major US metros for most of the last decade — a legacy of overbuilding into the shale boom, then the energy downturn, then the pandemic. The headline number is genuinely elevated, but it obscures the real story, which is a market split cleanly into a trophy tier that works and a commodity tier that does not.',
          'The energy economy is the reason for both the volatility and the concentration. Oil-and-gas tenancy anchors the Energy Corridor and Westchase, and those submarkets move with the commodity cycle more than the rest of the metro. Meanwhile, corporate diversification — healthcare around the Texas Medical Center, the port and petrochemical complex, and master-planned corporate campuses like the ExxonMobil-anchored Springwoods cluster near The Woodlands — gives Houston demand drivers beyond pure energy that have grown more important each cycle.',
          'For a tenant, Houston is the deepest concession market in Texas, and the practical questions are all about tier and submarket. Which trophy buildings are holding the line on rent versus quietly dealing; where the live sublease inventory is and whether term-remaining works for you; and whether an Energy Corridor or Westchase repricing story creates an opening. This is a market where a well-run tenant rep process routinely resets a company\'s occupancy cost materially lower.',
        ],
        servicesIntro: [
          'CRECO covers Houston as part of a Texas-wide office practice. In the most tenant-favorable major office market in the country, the value of representation is capturing the full extent of the leverage — benchmarking trophy concessions against signed deals, and running the direct-versus-sublease comparison that so often decides Houston deals on economics.',
          'Tenant rep here regularly produces double-digit-percent better economics than a single-building negotiation, because the concession depth is easy to under-ask for without market-wide comparables. We track the live sublease set alongside direct availabilities, qualify buildings on amenities, parking, and structural quality, and negotiate TI, free rent, and options with the landlord\'s real position in view.',
          'For owners and investors, Houston is where the reposition-and-convert questions are most live in Texas, and we underwrite them without rose-tinting — hold-versus-sell-versus-reposition at the asset level, with Texas-wide 1031 buyer flow when it is time to trade.',
        ],
        submarkets: [
          {
            name: 'CBD / Downtown',
            characterization: 'Trophy holds; B & C struggle',
            description: 'Tunnel-connected core with a clear trophy-vs-commodity split. New and renovated highrises hold tenancy; older stock carries heavy vacancy and leads the metro\'s conversion pipeline.',
            href: '/houston-commercial-real-estate',
          },
          {
            name: 'Uptown / Galleria',
            characterization: 'Trophy + mixed-use',
            description: 'The premier mixed-use office-and-retail district. Trophy Galleria-area highrises hold tenancy on amenities and address; the surrounding commodity stock is softer.',
          },
          {
            name: 'Energy Corridor (West)',
            characterization: 'Energy-cycle sensitive',
            description: 'The heart of oil-and-gas office tenancy along I-10 West. Vacancy and concessions track the commodity cycle most directly of any Houston submarket.',
          },
          {
            name: 'Westchase',
            characterization: 'Energy + services value',
            description: 'Central-west energy and professional-services submarket. Value pricing and deep concessions; a pragmatic option for tenants prioritizing cost over a trophy address.',
          },
          {
            name: 'The Woodlands / North',
            characterization: 'Master-planned, resilient',
            description: 'Amenity-rich master-planned corporate submarket near the ExxonMobil/Springwoods cluster. More resilient tenancy and a different tenant experience than the older highrise stock.',
          },
          {
            name: 'Greenway Plaza / Sugar Land',
            characterization: 'Central + suburban SW',
            description: 'Greenway offers a central, mixed-use option between downtown and the Galleria; Sugar Land anchors the affluent southwest suburbs with newer suburban product.',
          },
        ],
        whyBullets: [
          'Texas-wide office practice — we compare Houston against Dallas, Austin, and San Antonio on total occupancy cost',
          'We run the direct-vs-sublease comparison that decides so many Houston deals on economics',
          'Fluent in the trophy-vs-commodity split and the energy-cycle submarket dynamics',
          'Senior broker leads every engagement, from a 3,000 SF suite to a full-floor requirement',
          'Concession benchmarking from signed deals — critical in the deepest concession market in Texas',
          'Full-service representation — tenants, landlords/owners, and investors; tenant rep is typically paid by the landlord',
          'Honest hold-vs-sell-vs-reposition underwriting for owners, with Texas-wide 1031 buyer flow',
        ],
        listingsLink: {
          label: 'See Houston office listings →',
          href: '/listings?city=houston&type=office',
        },
        cityHubLink: {
          label: 'Houston market overview',
          href: '/houston-commercial-real-estate',
        },
        breadcrumbs: [
          { label: 'Texas CRE', href: '/markets' },
          { label: 'Houston', href: '/houston-commercial-real-estate' },
          { label: 'Office space' },
        ],
      }}
    />
  );
}
