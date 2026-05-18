import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact CRECO | Texas Commercial Real Estate Brokers',
  description:
    'Contact CRECO — Texas commercial real estate brokers serving San Antonio, Austin, Houston, Dallas–Fort Worth, and the Hill Country. Tenant representation, investment advisory, leasing & sales, owner services, and property management. (210) 817-3443.',
  keywords: [
    'contact CRECO',
    'texas commercial real estate broker',
    'commercial real estate broker san antonio',
    'commercial real estate broker austin',
    'commercial real estate broker houston',
    'commercial real estate broker dallas',
    'commercial real estate broker fair oaks ranch',
    'commercial real estate consultation texas',
    'tenant representation contact texas',
    'commercial property management contact texas',
    'CRECO phone number',
  ],
  openGraph: {
    title: 'Contact CRECO | Texas Commercial Real Estate',
    description:
      'Reach out to CRECO for tenant representation, investment advisory, leasing & sales, owner services, and property management across Texas.',
    url: 'https://www.crecotx.com/contact',
    type: 'website',
  },
  alternates: { canonical: 'https://www.crecotx.com/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
