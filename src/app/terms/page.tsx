import type { Metadata } from 'next';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';

/**
 * /terms — Terms of Use.
 *
 * This page existed as a footer link but the route was missing, which
 * meant the footer had a 404 anchor across the entire site (audit
 * caught it). This is a conservative, hand-written boilerplate that
 * mirrors the /privacy page structure (header band, article prose,
 * canonical, indexable). Copy is general-purpose CRE brokerage terms —
 * review + tighten with counsel before treating it as legally binding.
 */
export const metadata: Metadata = {
  title: 'Terms of Use | CRECO',
  description:
    'CRECO Terms of Use — the terms that govern use of crecotx.com, our services, and content published on the site.',
  alternates: { canonical: 'https://www.crecotx.com/terms' },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = 'July 13, 2026';

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20 bg-white">
        <div className="bg-primary py-12 text-white">
          <Container>
            <p className="overline mb-2 text-gold">Legal</p>
            <h1 className="font-heading text-display-sm font-bold">Terms of Use</h1>
            <p className="mt-2 text-body-sm text-white/60">Last updated: {LAST_UPDATED}</p>
          </Container>
        </div>

        <Container className="py-12 max-w-3xl">
          <article className="prose prose-lg space-y-6 text-foreground-muted leading-relaxed">
            <p>
              Welcome to CRECO &mdash; Commercial Real Estate Company (&ldquo;CRECO,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). These Terms of Use (&ldquo;Terms&rdquo;) govern your access to and use of the website located at{' '}
              <a href="https://www.crecotx.com" className="text-gold-dark hover:underline">crecotx.com</a> (the &ldquo;Site&rdquo;). By using the Site, you agree to be bound by these Terms. If you do not agree, please do not use the Site.
            </p>

            <h2 className="font-heading text-heading-lg font-bold text-primary mt-10">Use of the Site</h2>
            <p>
              You may use the Site for lawful personal and business purposes related to commercial real estate. You agree not to use the Site in any manner that could interfere with, disrupt, or overburden its operation, or that violates any applicable law or regulation.
            </p>

            <h2 className="font-heading text-heading-lg font-bold text-primary mt-10">Property Information</h2>
            <p>
              Property listings, pricing, availability, square footage, zoning, and other details published on the Site are provided for informational purposes and are subject to change without notice. CRECO makes no representation or warranty as to the accuracy of any listing information; verify all material facts with the applicable listing broker or property owner before making any transaction decision.
            </p>

            <h2 className="font-heading text-heading-lg font-bold text-primary mt-10">Not Legal, Tax, or Investment Advice</h2>
            <p>
              Content on the Site &mdash; including insights articles, market reports, valuation estimates, and educational guides &mdash; is provided for general information only and does not constitute legal, tax, accounting, or investment advice. Consult a qualified professional before acting on any information found on the Site.
            </p>

            <h2 className="font-heading text-heading-lg font-bold text-primary mt-10">Broker Licensing</h2>
            <p>
              CRECO operates under Texas Real Estate Commission (TREC) license #9014367. Real estate brokerage services are provided in accordance with TREC rules and applicable Texas law. Consumer protection information is available in the site footer.
            </p>

            <h2 className="font-heading text-heading-lg font-bold text-primary mt-10">Intellectual Property</h2>
            <p>
              The Site&apos;s design, logo, text, graphics, and other content are the property of CRECO or its licensors and are protected by copyright and trademark law. You may not reproduce, republish, or distribute Site content without our prior written permission, except that limited quotation for personal or editorial purposes is permitted with attribution.
            </p>

            <h2 className="font-heading text-heading-lg font-bold text-primary mt-10">Third-Party Links</h2>
            <p>
              The Site may link to third-party websites (e.g., LoopNet, Google Maps, TREC). CRECO does not control those sites and is not responsible for their content, policies, or practices. Visits to linked sites are at your own risk.
            </p>

            <h2 className="font-heading text-heading-lg font-bold text-primary mt-10">Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, CRECO and its affiliates, principals, employees, and agents will not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Site or reliance on any content provided through the Site.
            </p>

            <h2 className="font-heading text-heading-lg font-bold text-primary mt-10">Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. When we do, we&apos;ll update the &ldquo;Last updated&rdquo; date above. Continued use of the Site after changes constitutes acceptance of the updated Terms.
            </p>

            <h2 className="font-heading text-heading-lg font-bold text-primary mt-10">Governing Law</h2>
            <p>
              These Terms are governed by the laws of the State of Texas, without regard to conflict-of-laws principles. Any dispute arising under these Terms is subject to the exclusive jurisdiction of the state and federal courts located in Bexar County, Texas.
            </p>

            <h2 className="font-heading text-heading-lg font-bold text-primary mt-10">Contact</h2>
            <p>
              Questions about these Terms? Reach us at{' '}
              <a href="mailto:info@crecotx.com" className="text-gold-dark hover:underline">info@crecotx.com</a>{' '}
              or via the{' '}
              <Link href="/contact" className="text-gold-dark hover:underline">contact page</Link>.
            </p>
          </article>
        </Container>
      </main>
      <Footer />
    </>
  );
}
