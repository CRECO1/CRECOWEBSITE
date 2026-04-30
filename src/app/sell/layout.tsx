import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'List Your Commercial Property | CRECO San Antonio',
  description:
    'Sell or lease your commercial property in San Antonio with CRECO. Request a no-obligation Broker Opinion of Value or leasing strategy from a CRECO principal.',
  keywords: [
    'sell commercial property San Antonio',
    'list commercial property San Antonio',
    'lease commercial property San Antonio',
    'commercial broker opinion of value Texas',
    'San Antonio commercial real estate broker',
    'list warehouse for lease San Antonio',
    'list office for sale San Antonio',
    'CRECO listing services',
  ],
  openGraph: {
    title: 'List Your Commercial Property | CRECO',
    description:
      'Request a no-obligation Broker Opinion of Value or leasing strategy from a CRECO principal.',
    url: 'https://www.crecotx.com/sell',
    type: 'website',
  },
  alternates: { canonical: 'https://www.crecotx.com/sell' },
};

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
