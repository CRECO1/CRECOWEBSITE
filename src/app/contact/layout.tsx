import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact CRECO | San Antonio Commercial Real Estate',
  description:
    'Contact CRECO — San Antonio\'s commercial real estate company. Schedule a consultation, ask about a property, or get tenant representation.',
  keywords: [
    'contact CRECO',
    'San Antonio commercial real estate contact',
    'commercial real estate broker San Antonio',
    'CRECO phone number',
    'San Antonio CRE consultation',
  ],
  openGraph: {
    title: 'Contact CRECO | Commercial Real Estate San Antonio',
    description:
      'Reach out to CRECO for tenant representation, investment advisory, leasing & sales, or property management services.',
    url: 'https://www.crecotx.com/contact',
    type: 'website',
  },
  alternates: { canonical: 'https://www.crecotx.com/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
