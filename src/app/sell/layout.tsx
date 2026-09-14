import type { Metadata } from 'next';

/**
 * The /sell page is a client component and can't export metadata itself, and it
 * had no sibling layout — so it inherited the generic homepage <title>. That's
 * why it ranked ~page 6 for seller intent despite ~280 monthly impressions.
 * This gives it a title + description actually targeting "sell commercial
 * property in Texas" / disposition.
 */
export const metadata: Metadata = {
  title: 'Sell Your Commercial Property in Texas | Broker Disposition Services | CRECO',
  description:
    'Sell your Texas commercial property with CRECO — full-service disposition brokerage for retail, industrial, office, flex, and investment assets. Broker valuation, targeted marketing (CoStar, LoopNet, our principal network), aggressive offer negotiation, and 1031-exchange support. Serving San Antonio, Austin, Houston, Dallas–Fort Worth, and the Hill Country.',
  keywords: [
    'sell commercial property texas',
    'sell my commercial building texas',
    'commercial real estate disposition texas',
    'list commercial property for sale',
    'texas commercial real estate broker sell',
    'sell industrial property texas',
    'sell retail property texas',
    'sell office building texas',
    '1031 exchange texas commercial',
    'commercial property seller representation',
  ],
  alternates: { canonical: 'https://www.crecotx.com/sell' },
  openGraph: {
    title: 'Sell Your Commercial Property in Texas | CRECO',
    description:
      'Full-service disposition brokerage for Texas commercial real estate — broker valuation, targeted marketing, negotiation, and 1031 support. Retail, industrial, office, and investment assets statewide.',
    url: 'https://www.crecotx.com/sell',
    type: 'website',
  },
};

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return children;
}
