import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Texas Commercial Real Estate Listings | Lease & Sale | CRECO',
  description:
    'Active commercial real estate listings across Texas — office, warehouse, retail, flex, and land for lease and sale in San Antonio, Austin, Houston, DFW, and the Hill Country. Filter by type, submarket, and size. Updated daily.',
  keywords: [
    'texas commercial real estate listings',
    'commercial property for sale texas',
    'commercial property for lease texas',
    'office space for lease texas',
    'warehouse for lease texas',
    'flex space for lease texas',
    'retail space for lease texas',
    'commercial land for sale texas',
    'industrial property texas',
    'creco listings',
  ],
  openGraph: {
    title: 'Texas Commercial Real Estate Listings | CRECO',
    description:
      'Active commercial real estate listings across Texas — office, warehouse, retail, flex, and land. Updated daily.',
    url: 'https://www.crecotx.com/listings',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.crecotx.com/listings',
  },
};

export default function ListingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
