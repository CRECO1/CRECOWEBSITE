import { Container } from '@/components/ui/Container';
import { BUSINESS } from '@/lib/schema';

/**
 * "Sources & methodology" for the market-data pages (city and asset pages,
 * market and submarket profiles, guides, market reports, insights).
 *
 * The rents, vacancy, absorption, cap-rate and inventory figures on those pages
 * were published under CRECO's name with no source recorded anywhere — not in
 * the content, the code, or its history. So they are labelled for what they are:
 * CRECO market estimates, as of the month the figures on that page were last
 * written. They are deliberately NOT attributed to any research provider or data
 * service; name one here only once a figure is actually taken from it.
 */
export function SourcesMethodology({ asOf, sources, className = '' }: { asOf: string; sources?: { label: string; url?: string }[]; className?: string }) {
  return (
    <section aria-labelledby="sources-methodology" className={`border-t border-border bg-background-cream py-10 ${className}`}>
      <Container>
        <div className="max-w-3xl">
          <h2 id="sources-methodology" className="font-heading text-heading-sm font-semibold text-primary">
            Sources &amp; methodology
          </h2>
          {sources && sources.length > 0 ? (
            <>
              <p className="mt-3 text-body-sm leading-relaxed text-foreground-muted">
                Vacancy, asking-rent and absorption figures on this page are quoted from the{' '}
                <strong className="text-primary">named reports below</strong>, as of <strong className="text-primary">{asOf}</strong>.
                The reports survey different sets of buildings, so their figures differ; the ranges on this page show that spread.
                Commentary on concessions, tenant-representation results and cap rates is CRECO&rsquo;s own experience and
                estimates, not data from those reports. For current figures on a specific property or submarket, talk to our
                team at {BUSINESS.phoneDisplay} or {BUSINESS.email}.
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-body-sm text-foreground-muted marker:text-gold">
                {sources.map(src => (
                  <li key={src.label}>
                    {src.url
                      ? <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-gold-dark underline underline-offset-2 hover:text-gold">{src.label}</a>
                      : src.label}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-3 text-body-sm leading-relaxed text-foreground-muted">
              Market figures on this page — rents, vacancy, absorption, cap rates, pricing, and inventory — are{' '}
              <strong className="text-primary">CRECO market estimates</strong>, as of <strong className="text-primary">{asOf}</strong>.
              They are not attributed to a third-party research provider or data service, have not been independently
              verified, and are approximate; published market reports may differ. For current figures on a specific
              property or submarket, talk to our team at {BUSINESS.phoneDisplay} or {BUSINESS.email}.
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}

/** "2026-06-01" → "June 2026". */
export function asOfMonth(isoDate: string): string {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
