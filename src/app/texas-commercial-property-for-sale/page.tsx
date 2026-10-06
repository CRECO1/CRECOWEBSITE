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
  title: 'Commercial Property for Sale in San Antonio & the Hill Country | CRECO',
  description:
    'Commercial property for sale in San Antonio and the Texas Hill Country — retail centers, office and industrial buildings, pads and land. Investor, owner-user and 1031 advisory from CRECO.',
  keywords: [
    'commercial property for sale san antonio',
    'commercial real estate for sale san antonio',
    'commercial property for sale texas hill country',
    'commercial property for sale boerne',
    'commercial land for sale san antonio',
    'retail center for sale san antonio',
    'investment property san antonio',
    '1031 exchange san antonio',
    'commercial property for sale texas',
  ],
  alternates: { canonical: 'https://www.crecotx.com/texas-commercial-property-for-sale' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Commercial Property for Sale in San Antonio & the Hill Country | CRECO',
    description:
      'San Antonio and Hill Country commercial property for sale — retail, office, industrial and land. Investor, owner-user and 1031 advisory from a team that owns commercial property here.',
    url: 'https://www.crecotx.com/texas-commercial-property-for-sale',
    type: 'website',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const db = await getLandingPage('texas-commercial-property-for-sale');
  return {
    ...baseMetadata,
    title: db?.meta_title || (baseMetadata.title as string),
    description: db?.meta_description || (baseMetadata.description as string),
  };
}

export default async function Page() {
  const dbContent = await getLandingPage('texas-commercial-property-for-sale').catch(() => null);
  return (
    <PropertyLandingPage
      dbContent={dbContent}
      config={{
        sourcesAsOf: 'September 2026',
        eyebrow: 'San Antonio & Hill Country · For Sale',
        h1: 'Commercial Property for Sale in San Antonio & the Texas Hill Country',
        subhead:
          'Retail centers, office and industrial buildings, mixed-use, pads, and commercial land — investment and owner-user opportunities in San Antonio and the Hill Country. Whether you\'re acquiring your first asset, executing a 1031 exchange, or selling a property you\'ve held for years, CRECO underwrites every deal the way an owner would — because we own and operate commercial property here ourselves.',
        filterPropertyTypes: undefined,
        filterTransactionType: 'sale',
        canonicalPath: '/texas-commercial-property-for-sale',
        marketBullets: [
          {
            title: 'Pricing has reset.',
            body: 'Cap rates have moved out from their 2022 lows, creating entry points for patient capital in the right San Antonio and Hill Country submarkets — and making underwriting discipline matter more than ever.',
          },
          {
            title: 'Off-market matters.',
            body: 'Many of the best local deals never hit LoopNet or CoStar. Long-time owners in San Antonio and the Hill Country often sell through relationships, and CRECO\'s local owner network surfaces opportunities before they reach the open market.',
          },
          {
            title: '1031 timing matters.',
            body: 'Smart commercial investors structure acquisitions around 1031 exchange timing. We coordinate with your CPA and qualified intermediary on tax-driven decisions like 1031 timing, so deals close inside the windows.',
          },
        ],
        whyBullets: [
          'Underwriting and pro forma modeling on every deal we bring to you',
          'Off-market deal flow through our San Antonio and Hill Country owner and broker network',
          '1031 exchange identification with up- and down-leg coordination',
          'Owner-user and investor representation across San Antonio and the Hill Country',
          'An owner-operator\'s view — CRECO owns and operates Fair Oaks Plaza and our Lytle center',
        ],
        faqs: [
          {
            q: 'What cap rates can I expect for commercial property in San Antonio and the Hill Country?',
            a: 'Cap rates vary by asset type, submarket, tenant credit, and remaining lease term — a long-term net lease to a national tenant trades very differently from a multi-tenant center with near-term rollover. Our San Antonio office and industrial pages carry CRECO\'s current estimates for those asset types; for comps on a specific property, call (210) 817-3443.',
          },
          {
            q: 'What\'s the typical due diligence period in Texas?',
            a: 'Texas commercial transactions typically allow 30-60 days for inspection / due diligence after contract execution, followed by another 30-45 days to close. Diligence covers physical condition, environmental (Phase I and sometimes Phase II), title, survey, lease audit, financial verification, and zoning/entitlement confirmation. We coordinate the full diligence team — attorney, lender, environmental, surveyor, inspector.',
          },
          {
            q: 'Can CRECO help with 1031 exchanges?',
            a: 'Absolutely. 1031 exchanges have strict timing rules: 45 days from closing the relinquished property to identify replacement property, 180 days to close. We work in lockstep with your qualified intermediary to identify suitable replacement properties in San Antonio and the Hill Country within the 45-day window — including off-market opportunities that match your basis and DSCR requirements.',
          },
          {
            q: 'How do I evaluate a multi-tenant retail or office acquisition?',
            a: 'Beyond cap rate and price-per-SF: tenant credit and lease term remaining (weighted average lease term or WALT), rent rollover risk concentration, operating expense recovery (NNN vs gross leases), capital reserve requirements, market rent vs in-place rent (mark-to-market upside), and submarket vacancy trends. CRECO underwrites every shortlist deal on these factors before you spend due-diligence budget.',
          },
          {
            q: 'What about owner-user deals — buying a building for my own business?',
            a: 'Owner-user CRE acquisitions are often more affordable than leasing equivalent space when you factor SBA 504 financing (low down payment, long amortization), tax-deductible depreciation, and equity build-up. We help owner-users compare buy vs lease economics, secure SBA-eligible properties, and structure leases to outside tenants if you have excess space.',
          },
        ],
        relatedLinks: [
          { href: '/san-antonio-commercial-real-estate', label: 'San Antonio Commercial Real Estate' },
          { href: '/boerne-commercial-real-estate', label: 'Boerne' },
          { href: '/texas-retail-space-for-lease', label: 'Retail for Lease' },
          { href: '/texas-industrial-property-for-lease', label: 'Industrial for Lease' },
          { href: '/texas-office-space-for-lease', label: 'Office for Lease' },
          { href: '/owner-services', label: 'Owner Services' },
          { href: '/services/investment-advisory', label: 'Investment Advisory' },
          { href: '/listings?txn=sale', label: 'All Properties for Sale' },
        ],
        primaryCta: { href: '/contact', label: 'Speak with a CRECO Principal' },
        secondaryCta: { href: 'tel:+12108173443', label: '(210) 817-3443' },
      }}
    />
  );
}
