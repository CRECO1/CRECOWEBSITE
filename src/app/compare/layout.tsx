import type { Metadata } from 'next';

/**
 * Layout-level metadata for /compare. The compare tool isn't a
 * destination for organic search — it's a session tool that only
 * makes sense when a visitor has already shortlisted listings via
 * the CompareToggle on /listings cards. Noindexed to keep it out
 * of search results while still letting the URL be shared between
 * tabs within the same session.
 */
export const metadata: Metadata = {
  title: 'Compare Properties | CRECO',
  description:
    'Side-by-side comparison of shortlisted Texas commercial properties from your CRECO browsing session.',
  alternates: { canonical: 'https://www.crecotx.com/compare' },
  robots: 'noindex,nofollow',
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
