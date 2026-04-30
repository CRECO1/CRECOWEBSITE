import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Commercial Properties for Sale & Lease in San Antonio | CRECO',
  description:
    'Browse office, warehouse, flex, retail, and land commercial properties in San Antonio, TX. Filter by property type, transaction type, submarket, and size. New listings updated regularly.',
  keywords: [
    'San Antonio commercial properties for sale',
    'San Antonio commercial properties for lease',
    'office space for lease San Antonio',
    'warehouse for lease San Antonio',
    'flex space for lease San Antonio',
    'retail space for lease San Antonio',
    'commercial land for sale San Antonio',
    'industrial property San Antonio TX',
    'CRECO listings',
  ],
  openGraph: {
    title: 'Commercial Properties for Sale & Lease in San Antonio | CRECO',
    description:
      'Browse office, warehouse, flex, retail, and land in San Antonio. Filter by type, submarket, and size. New listings updated regularly.',
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
