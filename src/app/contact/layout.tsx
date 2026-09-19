import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { BUSINESS, breadcrumbList, businessRef, webPage } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Contact CRECO | Texas Commercial Real Estate Brokers',
  description:
    'Contact CRECO, Texas commercial real estate brokers for San Antonio, Austin, Houston, DFW, and the Hill Country. Call (210) 817-3443 or email info@crecotx.com.',
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
  return (
    <>
      <JsonLd
        data={[
          webPage('ContactPage', '/contact', 'Contact CRECO', `Contact CRECO - Commercial Real Estate Company: ${BUSINESS.phoneDisplay}, ${BUSINESS.email}, ${BUSINESS.fullAddress}.`,
            { mainEntity: businessRef }),
          breadcrumbList([{ name: 'Contact', path: '/contact' }]),
        ]}
      />
      {children}
    </>
  );
}
