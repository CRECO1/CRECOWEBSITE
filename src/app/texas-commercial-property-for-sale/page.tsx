export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { PropertyLandingPage } from '@/components/marketing/PropertyLandingPage';
import { getLandingPage } from '@/lib/supabase';

const baseMetadata: Metadata = {
  title: 'Commercial Property for Sale in Texas | CRECO',
  description:
    'Commercial property for sale across Texas — retail centers, industrial buildings, office buildings, mixed-use, and land. CRECO advises investors and owner-users on Texas CRE acquisitions in San Antonio, Austin, Houston, DFW, and statewide.',
  keywords: [
    'commercial property for sale texas',
    'commercial real estate for sale texas',
    'texas commercial property for sale',
    'commercial property for sale san antonio',
    'commercial property for sale austin',
    'commercial property for sale houston',
    'commercial property for sale dallas',
    'investment property texas',
    'commercial land for sale texas',
    'retail center for sale texas',
    'office building for sale texas',
    '1031 exchange texas',
  ],
  alternates: { canonical: 'https://www.crecotx.com/texas-commercial-property-for-sale' },
  openGraph: {
    title: 'Commercial Property for Sale in Texas | CRECO',
    description:
      'Texas commercial property for sale — retail, industrial, office, and land. Investment advisory and 1031 exchange identification statewide.',
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
        eyebrow: 'Texas Commercial Real Estate · For Sale',
        h1: 'Commercial Property for Sale in Texas',
        subhead:
          'Retail centers, industrial buildings, office buildings, mixed-use, and commercial land — investment-grade and owner-user opportunities across the major Texas markets. Whether you\'re acquiring your first asset, executing a 1031 exchange, or building a multi-property Texas portfolio, CRECO underwrites every deal with institutional rigor and brings off-market opportunities our network sees first.',
        filterPropertyTypes: undefined,
        filterTransactionType: 'sale',
        demoListings: [
          { id: 'd1', title: 'San Antonio Retail Center', slug: '#', address: '— San Antonio —', city: 'San Antonio', property_type: 'retail', transaction_type: 'sale', sqft: 22000, headline: '22,000 SF stabilized retail strip — 95% occupied, NOI growing', images: null, sale_price: 4250000 },
          { id: 'd2', title: 'Austin Industrial Park', slug: '#', address: '— Austin —', city: 'Austin', property_type: 'warehouse', transaction_type: 'sale', sqft: 75000, headline: 'Three-building flex industrial park, value-add opportunity', images: null, sale_price: 12500000 },
          { id: 'd3', title: 'Houston Medical Office', slug: '#', address: '— Houston —', city: 'Houston', property_type: 'office', transaction_type: 'sale', sqft: 38000, headline: 'Medical office building near Texas Medical Center, long-term tenants', images: null, sale_price: 18900000 },
        ],
        marketBullets: [
          {
            title: 'Texas is in a transition cycle.',
            body: 'Cap rates have moved out from 2022 lows, creating buying opportunities for patient capital. Stabilized assets in the right Texas submarkets are pricing 50-150 bps wider than two years ago — meaningful entry points for investors who can hold through the next cycle.',
          },
          {
            title: 'Off-market matters.',
            body: 'The best Texas commercial deals never hit LoopNet or CoStar. Family offices, generational owners, and institutional players move properties through broker relationships. CRECO\'s Texas network surfaces opportunities our clients see before the market does.',
          },
          {
            title: '1031 exchanges and depreciation matter.',
            body: 'Smart commercial investors structure acquisitions around 1031 exchange timing, cost segregation studies, bonus depreciation, and Opportunity Zone qualification. We coordinate with your CPA and qualified intermediary to time deals correctly.',
          },
        ],
        whyBullets: [
          'Underwriting and pro forma modeling on every deal we bring to you',
          'Off-market deal flow through our Texas owner and broker network',
          '1031 exchange identification with up- and down-leg coordination',
          'Cost-segregation, depreciation, and Opportunity Zone strategy',
          'Owner-user and investor representation across all Texas markets',
        ],
        faqs: [
          {
            q: 'What cap rates can I expect for Texas commercial property?',
            a: 'Texas cap rates vary by asset type, submarket, and tenant credit. As of recent quarters: stabilized retail typically trades at 6.5-8.5% cap; industrial at 6-7.5%; multi-tenant office at 7-9.5%; net-lease investment-grade tenants (Walgreens, McDonald\'s ground leases) at 5-6%. Submarket and credit risk drive significant variance — secondary submarkets and B/C tenants can push 1-2% wider.',
          },
          {
            q: 'What\'s the typical due diligence period in Texas?',
            a: 'Texas commercial transactions typically allow 30-60 days for inspection / due diligence after contract execution, followed by another 30-45 days to close. Diligence covers physical condition, environmental (Phase I and sometimes Phase II), title, survey, lease audit, financial verification, and zoning/entitlement confirmation. We coordinate the full diligence team — attorney, lender, environmental, surveyor, inspector.',
          },
          {
            q: 'Can CRECO help with 1031 exchanges?',
            a: 'Absolutely. 1031 exchanges have strict timing rules: 45 days from closing the relinquished property to identify replacement property, 180 days to close. We work in lockstep with your qualified intermediary to identify suitable Texas replacement properties (up-leg) within the 45-day window — including off-market opportunities that match your basis and DSCR requirements.',
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
