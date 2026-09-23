import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { BUSINESS } from '@/lib/schema';

/**
 * Where the opt-in link lands. Three states, all reassuring: confirmed, already
 * confirmed (a forwarded or re-clicked link), and an expired/unknown token.
 *
 * noindex — it is the tail of a private flow, not a page anyone should reach
 * from search.
 */
export const metadata: Metadata = {
  title: 'Subscription confirmed | CRECO',
  robots: { index: false, follow: false },
};

const COPY = {
  confirmed: {
    icon: CheckCircle,
    heading: "You're confirmed.",
    body: "That's everything — we'll email you when a Texas commercial property matching your search hits the CRECO listings. Reply to any of them to narrow it by submarket, size, or type.",
  },
  already: {
    icon: CheckCircle,
    heading: 'Already confirmed.',
    body: "This address was confirmed earlier, so you're on the list and nothing more is needed.",
  },
  invalid: {
    icon: AlertCircle,
    heading: "That link didn't work.",
    body: 'It may have expired or already been used. Sign up again and we&rsquo;ll send a fresh confirmation link.',
  },
} as const;

export default async function SubscribeConfirmedPage(
  { searchParams }: { searchParams: Promise<{ status?: string }> },
) {
  const { status } = await searchParams;
  const key = (status === 'already' || status === 'invalid') ? status : 'confirmed';
  const { icon: Icon, heading, body } = COPY[key];

  return (
    <>
      <Header variant="minimal" />
      <main className="min-h-screen pt-20">
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="mx-auto max-w-xl text-center">
              <Icon className={`mx-auto mb-6 h-14 w-14 ${key === 'invalid' ? 'text-foreground-muted' : 'text-gold'}`} />
              <h1 className="font-heading text-display-sm font-bold text-primary">{heading}</h1>
              <p
                className="mt-4 text-body text-foreground-muted leading-relaxed"
                dangerouslySetInnerHTML={{ __html: body }}
              />
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" asChild>
                  <Link href="/listings">Browse Texas properties</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href={key === 'invalid' ? '/property-alerts' : '/contact'}>
                    {key === 'invalid' ? 'Sign up again' : 'Talk to a broker'}
                  </Link>
                </Button>
              </div>
              <p className="mt-8 text-body-sm text-foreground-muted">
                Questions? Call{' '}
                <a href={`tel:${BUSINESS.phoneE164}`} className="text-gold-dark font-semibold hover:underline">
                  {BUSINESS.phoneDisplay}
                </a>.
              </p>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
