import type { Metadata } from 'next';

/**
 * Layout-level metadata for /get-started — the page itself is a
 * client component (multi-step form with useState), so it can't
 * export `metadata` directly. Splitting the route into layout +
 * page keeps the SEO surface server-rendered while the form stays
 * interactive.
 *
 * This is one of the highest-intent landing pages on the site —
 * search queries like "find commercial real estate broker san
 * antonio" should rank here. Metadata is tuned for that intent.
 */
export const metadata: Metadata = {
  title: 'Get Started with CRECO | Texas Commercial Real Estate Inquiry',
  description:
    'Tell us what you need — tenant rep, owner services, investment advisory, or property leasing. A CRECO principal follows up within one business day with vetted options or a no-obligation property opinion. Texas-wide.',
  keywords: [
    'commercial real estate inquiry texas',
    'find commercial real estate broker texas',
    'commercial property search texas',
    'tenant representation request',
    'commercial real estate consultation san antonio',
    'commercial real estate broker request',
    'CRECO get started',
    'commercial real estate help texas',
  ],
  alternates: { canonical: 'https://www.crecotx.com/get-started' },
  openGraph: {
    title: 'Get Started with CRECO',
    description:
      'Submit your tenant needs or owner requirements — a CRECO principal responds within one business day with vetted options.',
    url: 'https://www.crecotx.com/get-started',
    type: 'website',
  },
  robots: 'index,follow',
};

export default function GetStartedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
