import type { Metadata } from 'next';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = {
  title: 'Privacy Policy | CRECO',
  description: 'CRECO Privacy Policy — how we collect, use, and protect your information.',
  alternates: { canonical: 'https://www.crecotx.com/privacy' },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20 bg-white">
        <div className="bg-primary py-12 text-white">
          <Container>
            <p className="overline mb-2 text-gold">Legal</p>
            <h1 className="font-heading text-display-sm font-bold">Privacy Policy</h1>
            <p className="mt-2 text-body-sm text-white/60">Last updated: April 29, 2026</p>
          </Container>
        </div>

        <Container className="py-12 max-w-3xl">
          <article className="prose prose-lg space-y-6 text-foreground-muted leading-relaxed">
            <p>
              CRECO – Commercial Real Estate Company (&ldquo;CRECO,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) respects your privacy. This policy describes how we collect, use, and protect information you provide to us through our website at <a href="https://www.crecotx.com" className="text-gold-dark hover:underline">crecotx.com</a>.
            </p>

            <h2 className="font-heading text-heading-lg font-bold text-primary mt-10">Information We Collect</h2>
            <p>
              When you submit a tenant needs form, contact form, listing inquiry, or owner inquiry on our site, we collect the information you voluntarily provide — typically your name, company, email address, phone number, and any details about the property or space you&apos;re interested in. We may also collect basic technical information automatically (IP address, browser type, pages visited) for analytics and security purposes.
            </p>

            <h2 className="font-heading text-heading-lg font-bold text-primary mt-10">How We Use Your Information</h2>
            <ul className="list-disc list-outside pl-6 space-y-2">
              <li>To respond to your inquiry and provide the commercial real estate services you request</li>
              <li>To send you property recommendations, market updates, or follow-up communications related to your inquiry</li>
              <li>To improve our website, services, and client experience</li>
              <li>To comply with legal obligations under Texas real estate brokerage regulations</li>
            </ul>

            <h2 className="font-heading text-heading-lg font-bold text-primary mt-10">How We Share Your Information</h2>
            <p>
              We do not sell, rent, or trade your personal information to third parties. We may share information with:
            </p>
            <ul className="list-disc list-outside pl-6 space-y-2">
              <li>Service providers who help us operate the site (e.g. database hosting, email delivery) under confidentiality obligations</li>
              <li>Affiliated brokers, attorneys, lenders, or inspectors directly involved in a transaction you have engaged us for, with your knowledge</li>
              <li>Government authorities when legally required</li>
            </ul>

            <h2 className="font-heading text-heading-lg font-bold text-primary mt-10">Cookies & Analytics</h2>
            <p>
              Our website may use cookies and similar technologies for analytics and to improve user experience. You can disable cookies in your browser settings.
            </p>

            <h2 className="font-heading text-heading-lg font-bold text-primary mt-10">Data Retention & Security</h2>
            <p>
              We retain inquiry data only as long as needed to respond to your request and comply with our recordkeeping obligations as a Texas real estate broker. We use industry-standard safeguards to protect your information, but no system is 100% secure — please don&apos;t share sensitive information (Social Security numbers, credit card data, etc.) through our forms.
            </p>

            <h2 className="font-heading text-heading-lg font-bold text-primary mt-10">Your Rights</h2>
            <p>
              You may request that we update or delete your personal information at any time by emailing us at{' '}
              <a href="mailto:info@crecotx.com" className="text-gold-dark hover:underline">info@crecotx.com</a>. We will honor reasonable requests subject to legal requirements.
            </p>

            <h2 className="font-heading text-heading-lg font-bold text-primary mt-10">Children&apos;s Privacy</h2>
            <p>
              Our services are not directed at children under 13, and we do not knowingly collect information from children.
            </p>

            <h2 className="font-heading text-heading-lg font-bold text-primary mt-10">Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top reflects the most recent revision.
            </p>

            <h2 className="font-heading text-heading-lg font-bold text-primary mt-10">Contact</h2>
            <p>
              Questions about this policy? Reach us at{' '}
              <a href="mailto:info@crecotx.com" className="text-gold-dark hover:underline">info@crecotx.com</a> or{' '}
              <a href="tel:+12108173443" className="text-gold-dark hover:underline">(210) 817-3443</a>.
            </p>

            <hr className="my-10 border-border" />

            <p className="text-body-sm">
              <Link href="/" className="text-gold-dark hover:underline">← Back to home</Link>
            </p>
          </article>
        </Container>
      </main>
      <Footer />
    </>
  );
}
