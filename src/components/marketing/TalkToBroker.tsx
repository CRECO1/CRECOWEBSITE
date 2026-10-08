import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { PhoneCallText } from '@/components/marketing/PhoneCallText';

/**
 * Compact "Talk to a broker" block — the way out for a visitor who landed deep in the site (from an AI answer, a
 * search, an email) on a page whose only other action is a signup or a long scroll. Call / Text reuse
 * PhoneCallText; the quiet link goes to the short /get-started funnel. Deliberately one row, no form.
 */
export function TalkToBroker({
  surface,
  path = 'tenant',
  heading = 'Talk to a broker',
  body = 'Questions about space or a property in San Antonio or the Texas Hill Country? Call or text, or tell us what you need.',
  wrap = true,
  className = '',
}: {
  /** Analytics surface name, e.g. 'market-brief'. */
  surface: string;
  /** /get-started path to preselect. */
  path?: 'tenant' | 'buyer' | 'seller' | 'pm' | 'exploring';
  heading?: string;
  body?: string;
  /** Render inside its own section + Container (default). Pass false to drop it into an existing container. */
  wrap?: boolean;
  className?: string;
}) {
  const card = (
    <div
      className={`mx-auto max-w-3xl rounded-2xl border border-border bg-white p-6 sm:p-7 ${className}`}
      data-track-section="talk_to_broker"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-heading-md font-bold text-primary">{heading}</h2>
          <p className="mt-1 text-body-sm leading-relaxed text-foreground-muted">{body}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <PhoneCallText variant="inline" surface={`${surface}-talk-to-broker`} />
          <Link
            href={`/get-started?path=${path}`}
            data-track-id={`talk_get_started_${surface}`}
            className="inline-flex min-h-[44px] items-center gap-1.5 text-body-sm font-semibold text-gold-dark underline-offset-4 hover:text-gold hover:underline"
          >
            Tell us what you need <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
  if (!wrap) return card;
  return (
    <section className="section-compact bg-background-cream">
      <Container>{card}</Container>
    </section>
  );
}
