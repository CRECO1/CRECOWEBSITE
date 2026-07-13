import type { Metadata } from 'next';
import Script from 'next/script';
import { Suspense } from 'react';
import { MobileStickyCTA } from '@/components/layout/MobileStickyCTA';
import { CompareBar } from '@/components/listings/CompareBar';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { RecaptchaScript } from '@/components/forms/Recaptcha';
import { UtmCapture } from '@/components/analytics/UtmCapture';
// ExitIntentModal removed from the global layout per owner request (the
// "Before you go — get our Q2 Texas market report" popup felt
// aggressive). The component file at @/components/marketing/ExitIntentModal
// is intentionally left in the repo so it can be re-mounted later
// without rebuilding it. To turn back on: re-add the import + a
// <Suspense fallback={null}><ExitIntentModal /></Suspense> wrapper in
// the body below.
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.crecotx.com'),
  title: {
    // Each page provides its own complete title (already includes "| CRECO")
    default: 'Texas Commercial Real Estate | Retail, Industrial & Office | CRECO',
    template: '%s',
  },
  description:
    'CRECO is a Texas commercial real estate firm specializing in retail, industrial, and office properties for lease and sale. Tenant representation, owner services, and portfolio advisory for multi-property owners across Texas — from our Fair Oaks Ranch headquarters at 8000 Fair Oaks Pkwy.',
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
    // images intentionally omitted — Next.js auto-discovers /opengraph-image.tsx
    // and uses it as the default for every page (1200×630 branded design).
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Texas Commercial Real Estate | CRECO',
    description:
      'Texas commercial real estate — retail, industrial, and office. Tenant representation and owner services for multi-property investors statewide.',
    // Twitter card image also pulled from /opengraph-image.tsx automatically
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
        {/* Skip-to-content link — invisible until focused, jumps
            keyboard users past the header/nav straight to the page's
            main content. Standard a11y pattern; used to be missing
            (caught by the audit). Every page's <main> element needs
            id="main-content" for this to work — Next.js layouts here
            already wrap children with a <main> in each page. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-gold"
        >
          Skip to main content
        </a>
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
                  identifier: {
                    '@type': 'PropertyValue',
                    propertyID: 'TREC License',
                    value: '9014367-BB',
                  },
                  address: {
                    '@type': 'PostalAddress',
                    streetAddress: '8000 Fair Oaks Pkwy, Suite 102',
                    addressLocality: 'Fair Oaks Ranch',
                    addressRegion: 'TX',
                    postalCode: '78015',
                    addressCountry: 'US',
                  },
                  geo: {
                    '@type': 'GeoCoordinates',
                    // Approximate coords for 8000 Fair Oaks Pkwy, Fair Oaks Ranch
                    latitude: 29.7449,
                    longitude: -98.6303,
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
                    { '@type': 'City', name: 'Fair Oaks Ranch' },
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
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
            `}
          </Script>
        )}
        {/* UTM + referrer attribution capture — wrapped in Suspense
            because useSearchParams() inside is a Next.js requirement
            for static-export safety. Renders nothing. */}
        <Suspense fallback={null}>
          <UtmCapture />
        </Suspense>
        {/* id="main-content" is the target of the skip-to-content
            link above. Using a div wrapper (not <main>) so it doesn't
            conflict with the <main> element each page renders inside
            its own layout — nested main tags would trip screen readers. */}
        <div id="main-content">{children}</div>
        {/* ExitIntentModal removed — see import comment at top. */}
        <MobileStickyCTA />
        <CompareBar />
        {/*
          Chat concierge — Claude-powered, has live listings + lead
          capture tools. Enabled by default; set
            NEXT_PUBLIC_CHAT_ENABLED=false
          in Vercel env to turn off. Requires ANTHROPIC_API_KEY on the
          server for /api/chat to actually respond; without it the
          widget still mounts and gracefully degrades to a
          "call (210) 817-3443" fallback message via the /api/chat 503.

          Also set SUPABASE_SERVICE_ROLE_KEY so the search_listings +
          capture_lead tools can query/insert against Supabase; without
          it the tools return a "not configured, call us" message that
          Claude relays.
        */}
        {process.env.NEXT_PUBLIC_CHAT_ENABLED !== 'false' && <ChatWidget />}
        <RecaptchaScript />
      </body>
    </html>
  );
}
