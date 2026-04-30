import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.crecotx.com'),
  title: {
    default: 'San Antonio Commercial Real Estate | CRECO',
    template: '%s | CRECO',
  },
  description:
    'CRECO is a San Antonio commercial real estate company specializing in office, warehouse, flex, retail, and land — for tenants, owners, and investors across South Texas.',
  keywords: [
    'San Antonio commercial real estate',
    'CRECO',
    'commercial real estate company San Antonio',
    'San Antonio office space for lease',
    'San Antonio warehouse for lease',
    'San Antonio flex space for lease',
    'San Antonio retail space for lease',
    'San Antonio industrial real estate',
    'commercial property San Antonio TX',
    'tenant representation San Antonio',
    'commercial property management San Antonio',
    'investment advisory commercial real estate Texas',
    'commercial property development San Antonio',
  ],
  authors: [{ name: 'CRECO – Commercial Real Estate Company' }],
  creator: 'CRECO – Commercial Real Estate Company',
  publisher: 'CRECO – Commercial Real Estate Company',
  formatDetection: { telephone: true, address: true, email: true },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icon.svg', color: '#C9A962' },
    ],
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CRECO',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#1A1A1A',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.crecotx.com',
    siteName: 'CRECO – Commercial Real Estate Company',
    title: 'San Antonio Commercial Real Estate | CRECO',
    description:
      'Office, warehouse, flex, retail and land in San Antonio and South Texas. Tenant representation, investment advisory, development, and property management.',
    images: [
      {
        url: '/images/creco-logo.jpg',
        width: 1200,
        height: 630,
        alt: 'CRECO – Commercial Real Estate Company',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'San Antonio Commercial Real Estate | CRECO',
    description:
      'Where your real estate ventures find the support they deserve. San Antonio commercial real estate — office, warehouse, flex, retail, and land.',
    images: ['/images/creco-logo.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? '',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* JSON-LD Structured Data — RealEstateAgent + LocalBusiness */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': ['RealEstateAgent', 'LocalBusiness'],
                  '@id': 'https://www.crecotx.com/#business',
                  name: 'CRECO – Commercial Real Estate Company',
                  url: 'https://www.crecotx.com',
                  logo: 'https://www.crecotx.com/images/creco-logo.jpg',
                  image: 'https://www.crecotx.com/images/creco-logo.jpg',
                  description:
                    'San Antonio commercial real estate company offering tenant representation, investment advisory, property development, leasing & sales, market research, property management, and sustainability consulting.',
                  telephone: '+1-210-817-3443',
                  email: 'info@crecotx.com',
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: 'San Antonio',
                    addressRegion: 'TX',
                    addressCountry: 'US',
                  },
                  geo: {
                    '@type': 'GeoCoordinates',
                    latitude: 29.4241,
                    longitude: -98.4936,
                  },
                  areaServed: [
                    { '@type': 'City', name: 'San Antonio' },
                    { '@type': 'City', name: 'New Braunfels' },
                    { '@type': 'City', name: 'Schertz' },
                    { '@type': 'City', name: 'Boerne' },
                    { '@type': 'State', name: 'Texas' },
                  ],
                  openingHoursSpecification: [
                    {
                      '@type': 'OpeningHoursSpecification',
                      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                      opens: '09:00',
                      closes: '18:00',
                    },
                  ],
                  priceRange: '$$$',
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://www.crecotx.com/#website',
                  url: 'https://www.crecotx.com',
                  name: 'CRECO – Commercial Real Estate Company',
                  description: 'San Antonio commercial real estate — where your real estate ventures find the support they deserve.',
                  publisher: { '@id': 'https://www.crecotx.com/#business' },
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate: 'https://www.crecotx.com/listings?q={search_term_string}',
                    },
                    'query-input': 'required name=search_term_string',
                  },
                },
              ],
            }),
          }}
        />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
        {children}
      </body>
    </html>
  );
}
