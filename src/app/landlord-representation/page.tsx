import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { RepresentationPage } from '@/components/marketing/RepresentationPage';
import { LANDLORD_PAGE as CONTENT } from '@/lib/representation-pages';
import { SITE_URL } from '@/lib/schema';

export const metadata: Metadata = {
  title: CONTENT.metaTitle,
  description: CONTENT.metaDescription,
  alternates: { canonical: `${SITE_URL}${CONTENT.path}` },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: CONTENT.metaTitle,
    description: CONTENT.metaDescription,
    url: `${SITE_URL}${CONTENT.path}`,
    type: 'website',
  },
};

export default function Page() {
  return <RepresentationPage content={CONTENT} />;
}
