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
  title: 'Office Space for Lease in San Antonio & the Hill Country | CRECO',
  description:
    'Office space for lease in San Antonio and the Texas Hill Country — Class A and B, medical office, professional and executive suites in Stone Oak, the Medical Center, the I-10 corridor, Fair Oaks Ranch and Boerne.',
  keywords: [
    'office space for lease san antonio',
    'office space for lease texas hill country',
    'office space for lease boerne',
    'office space for lease fair oaks ranch',
    'office space for lease stone oak',
    'medical office for lease san antonio',
    'executive suite san antonio',
    'class a office san antonio',
    'office space for lease texas',
  ],
  alternates: { canonical: 'https://www.crecotx.com/texas-office-space-for-lease' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Office Space for Lease in San Antonio & the Hill Country | CRECO',
    description:
      'Office space in San Antonio and the Texas Hill Country — Class A/B, medical, professional and executive suites, from a team that leases executive suites in its own building.',
    url: 'https://www.crecotx.com/texas-office-space-for-lease',
    type: 'website',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const db = await getLandingPage('texas-office-space-for-lease');
  return {
    ...baseMetadata,
    title: db?.meta_title || (baseMetadata.title as string),
    description: db?.meta_description || (baseMetadata.description as string),
  };
}

export default async function Page() {
  const dbContent = await getLandingPage('texas-office-space-for-lease').catch(() => null);
  return (
    <PropertyLandingPage
      dbContent={dbContent}
      config={{
        sourcesAsOf: 'April 2026',
        eyebrow: 'San Antonio & Hill Country · Office',
        h1: 'Office Space for Lease in San Antonio & the Texas Hill Country',
        subhead:
          'Class A and B office, medical office, professional suites, and executive office — in San Antonio and the Hill Country, from Stone Oak, the Medical Center, and the I-10 corridor to Fair Oaks Ranch and Boerne. Whether you need a single executive suite or a full floor, CRECO matches your team size, growth path, and commute to the right building — and we lease executive suites in our own Fair Oaks Plaza.',
        // 'medical office' included deliberately — the subhead above promises
        // medical office, so the grid must actually show it.
        filterPropertyTypes: ['office', 'medical office'],
        filterTransactionType: 'lease',
        canonicalPath: '/texas-office-space-for-lease',
        marketBullets: [
          {
            title: 'Office is bifurcating.',
            body: 'Newer, well-amenitized space is in tight supply and commands premium rents, while older Class B space is easier to find — meaning generous concessions for the right tenant. Knowing which side of the market you want to play on is half the battle.',
          },
          {
            title: 'Submarkets vary widely.',
            body: 'Stone Oak is not Downtown. The Medical Center is not the Pearl, and a Hill Country suite in Boerne or Fair Oaks Ranch serves a different team than either. Each submarket has different rent benchmarks, parking ratios, commute patterns, and amenities. We help you pick the right one.',
          },
          {
            title: 'Tenant improvement is everything.',
            body: 'Landlords routinely offer tenant improvement allowance and free rent for the right tenant, credit, and term — often enough to fund a meaningful buildout. The asking rent only tells half the story; the effective rent after concessions is the real number.',
          },
        ],
        whyBullets: [
          'Tenant representation across San Antonio and Hill Country office submarkets — Stone Oak, the Medical Center, Northwest San Antonio, the I-10 corridor, Fair Oaks Ranch, and Boerne',
          'Class A/B, medical office, and executive suite expertise — from a team that leases executive suites in its own building',
          'Effective rent analysis — comparing offers net of TI allowance, free rent, and amenities',
          'Buildout coordination from space planning to move-in',
          'Renew vs. relocate analysis to maximize leverage at lease expiration',
        ],
        faqs: [
          {
            q: 'What does office space cost in San Antonio and the Hill Country?',
            a: 'It depends on building class, submarket, and how the lease is quoted. Most multi-tenant office is quoted Full Service Gross (rent includes operating expenses), while medical office and some smaller buildings are quoted NNN or modified gross — so normalize offers before comparing them. Our San Antonio office space page has CRECO\'s current estimates by class; for comps on a specific building, call (210) 817-3443. Always compare effective rent — net of free-rent months and tenant improvement allowance — not just the asking rate.',
          },
          {
            q: 'What\'s the difference between Class A, B, and C office?',
            a: 'Class A: newer construction (typically post-2000), high-end finishes, modern amenities (fitness, conferencing, on-site food, structured parking), prime submarkets, top rents. Class B: well-maintained older buildings (typically 1990s-2000s), functional space, reasonable amenities, good submarkets, mid-market rents. Class C: older buildings (pre-1990s), basic finishes, limited amenities, secondary submarkets, lowest rents. Class B is often the sweet spot for value.',
          },
          {
            q: 'How much parking should I expect with office space?',
            a: 'Parking ratios are quoted per 1,000 SF leased. Suburban office typically offers around 4:1000 (4 spaces per 1,000 SF), which works for most companies. Downtown buildings often have less, with paid structured parking. Medical office and call centers may need more. Always confirm in writing — parking ratio is one of the most-disputed lease items.',
          },
          {
            q: 'Can I sublease office space?',
            a: 'Yes — sublease can be a good way to save against direct lease rates, especially for terms under 3 years. Subleases come from companies that over-leased and need to offload space. CRECO watches sublease availability in San Antonio and the Hill Country and can shortlist sublease options alongside direct leases.',
          },
          {
            q: 'What is "Full Service Gross" vs "NNN" for office leases?',
            a: 'Full Service Gross (FSG) means the landlord covers operating expenses (taxes, insurance, utilities, janitorial, CAM) within the quoted rent — though tenants pay increases above a base year. NNN means the tenant pays a base rent plus their share of expenses. FSG is the most common structure for multi-tenant office; medical office and some smaller buildings run NNN or modified gross.',
          },
          {
            q: 'Do you only work in San Antonio and the Hill Country?',
            a: 'That is where we focus and where we own property. If you\'re a tenant with a requirement elsewhere in Texas, we can help there too.',
          },
        ],
        relatedLinks: [
          { href: '/san-antonio-office-space', label: 'San Antonio Office Space' },
          { href: '/8000-fair-oaks-pkwy', label: 'Fair Oaks Plaza' },
          { href: '/boerne-commercial-real-estate', label: 'Boerne' },
          { href: '/texas-retail-space-for-lease', label: 'Retail Space' },
          { href: '/texas-industrial-property-for-lease', label: 'Industrial / Warehouse' },
          { href: '/texas-commercial-property-for-sale', label: 'Properties for Sale' },
          { href: '/services/tenant-representation', label: 'Tenant Representation' },
          { href: '/listings?type=office', label: 'All Office Listings' },
        ],
        primaryCta: { href: '/get-started', label: 'Get Started' },
        secondaryCta: { href: 'tel:+12108173443', label: '(210) 817-3443' },
      }}
    />
  );
}
