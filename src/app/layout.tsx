import type { Metadata } from 'next';
import Script from 'next/script';
import { MobileStickyCTA } from '@/components/layout/MobileStickyCTA';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.crecotx.com'),
  title: {
    default: 'Texas Commercial Real Estate | Retail, Industrial & Office | CRECO',
    template: '%s | CRECO – Texas Commercial Real Estate',
  },
  description:
    'CRECO is a Texas commercial real estate firm specializing in retail, industrial, and office properties for lease and sale. Tenant representation, owner services, and portfolio advisory for multi-property owners across Texas — from our San Antonio headquarters.',
  keywords: [
    'Texas commercial real estate',
    'commercial real estate Texas',
    'commercial property Texas',
    'commercial property for sale Texas',
    'commercial property for lease Texas',
    'retail space for lease Texas',
    'industrial property for lease Texas',
    'warehouse for lease Texas',
    'office space for lease Texas',
    'tenant representation Texas',
    'commercial real estate broker Texas',
    'commercial property owner services Texas',
    'portfolio commercial real estate Texas',
    'CRECO',
    'San Antonio commercial real estate',
    'Austin commercial real estate',
    'Houston commercial real estate',
    'Dallas commercial real estate',
    'Fort Worth commercial real estate',
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
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [{ rel: 'mask-icon', url: '/icon.svg', color: '#C9A962' }],
  },
  manifest: '/site.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'CRECO' },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#1A1A1A',
    'geo.region': 'US-TX',
    'geo.placename': 'San Antonio',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.crecotx.com',
    siteName: 'CRECO – Texas Commercial Real Estate',
    title: 'Texas Commercial Real Estate | Retail, Industrial & Office | CRECO',
    description:
      'Retail, industrial, and office commercial property across Texas. Tenant representation, owner services, and portfolio advisory. Trusted by multi-property owners and growing tenants statewide.',
    images: [
      {
        url: '/images/creco-logo.jpg',
        width: 1200,
        height: 630,
        alt: 'CRECO – Texas Commercial Real Estate Company',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Texas Commercial Real Estate | CRECO',
    description:
      'Texas commercial real estate — retail, industrial, and office. Tenant representation and owner services for multi-property investors statewide.',
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
        {/* JSON-LD Structured Data — RealEstateAgent + LocalBusiness + WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': ['RealEstateAgent', 'LocalBusiness', 'Organization'],
                  '@id': 'https://www.crecotx.com/#business',
                  name: 'CRECO – Commercial Real Estate Company',
                  alternateName: 'CRECO',
                  url: 'https://www.crecotx.com',
                  logo: 'https://www.crecotx.com/images/creco-logo.jpg',
                  image: 'https://www.crecotx.com/images/creco-logo.jpg',
                  description:
                    'Texas commercial real estate firm specializing in retail, industrial, and office properties. Tenant representation, owner services, investment advisory, leasing & sales, property management, and portfolio strategy for multi-property owners across Texas.',
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
                  // Texas-wide service area
                  areaServed: [
                    { '@type': 'State', name: 'Texas' },
                    { '@type': 'City', name: 'San Antonio' },
                    { '@type': 'City', name: 'Austin' },
                    { '@type': 'City', name: 'Houston' },
                    { '@type': 'City', name: 'Dallas' },
                    { '@type': 'City', name: 'Fort Worth' },
                    { '@type': 'City', name: 'El Paso' },
                    { '@type': 'City', name: 'Corpus Christi' },
                    { '@type': 'City', name: 'New Braunfels' },
                    { '@type': 'City', name: 'Boerne' },
                    { '@type': 'City', name: 'Schertz' },
                  ],
                  knowsAbout: [
                    'Retail commercial real estate',
                    'Industrial commercial real estate',
                    'Warehouse leasing',
                    'Office leasing',
                    'Tenant representation',
                    'Investment advisory',
                    'Property management',
                    'Property development',
                    'Commercial real estate sales',
                    'Multi-property owner services',
                    'Portfolio asset management',
                    '1031 exchanges',
                  ],
                  hasOfferCatalog: {
                    '@type': 'OfferCatalog',
                    name: 'Commercial Real Estate Services',
                    itemListElement: [
                      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Tenant Representation', url: 'https://www.crecotx.com/services/tenant-representation' } },
                      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Investment Advisory', url: 'https://www.crecotx.com/services/investment-advisory' } },
                      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Leasing & Sales', url: 'https://www.crecotx.com/services/leasing-sales' } },
                      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Property Management', url: 'https://www.crecotx.com/services/property-management' } },
                      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Property Development', url: 'https://www.crecotx.com/services/development' } },
                      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Sustainability Consulting', url: 'https://www.crecotx.com/services/sustainability' } },
                    ],
                  },
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
                  name: 'CRECO – Texas Commercial Real Estate',
                  description:
                    'Texas commercial real estate. Retail, industrial, and office properties for lease and sale. Tenant representation and owner services statewide.',
                  publisher: { '@id': 'https://www.crecotx.com/#business' },
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate: 'https://www.crecotx.com/listings?q={search_term_string}',
                    },
                    'query-input': 'required name=search_term_string',
                  },
                  inLanguage: 'en-US',
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
        <MobileStickyCTA />
      </body>
    </html>
  );
}
