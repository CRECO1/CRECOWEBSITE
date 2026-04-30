import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meet the CRECO Team | Commercial Real Estate Brokers San Antonio',
  description:
    'Meet the principals and brokers behind CRECO — commercial real estate experts who live and work in San Antonio.',
  keywords: [
    'CRECO team',
    'San Antonio commercial real estate brokers',
    'San Antonio CRE principals',
    'commercial broker San Antonio TX',
    'tenant representation broker San Antonio',
    'investment advisory broker San Antonio',
  ],
  openGraph: {
    title: 'Meet the CRECO Team',
    description:
      'Principal-level brokers who treat every assignment like our name is on the building.',
    url: 'https://www.crecotx.com/team',
    type: 'website',
  },
  alternates: { canonical: 'https://www.crecotx.com/team' },
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
