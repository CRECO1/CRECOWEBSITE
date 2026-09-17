import { Container } from '@/components/ui/Container';
import { JsonLd } from '@/components/seo/JsonLd';
import { faqPage, type Faq } from '@/lib/schema';

/**
 * Visible, server-rendered FAQ + matching FAQPage JSON-LD. The answers are
 * in the HTML (native <details>, no JS) so crawlers that don't execute
 * JavaScript — most AI answer-engine fetchers — read every answer.
 */
export function FaqSection({
  faqs,
  path,
  heading = 'Frequently asked questions',
  eyebrow = 'FAQ',
  className = 'section-luxury bg-white',
  emitSchema = true,
}: {
  faqs: Faq[];
  /** Page path — used for the FAQPage @id. */
  path?: string;
  heading?: string;
  eyebrow?: string;
  className?: string;
  emitSchema?: boolean;
}) {
  if (faqs.length === 0) return null;
  return (
    <section className={className} id="faq" aria-labelledby="faq-heading">
      {emitSchema && <JsonLd data={faqPage(faqs, path)} />}
      <Container>
        <div className="mx-auto max-w-3xl">
          <p className="overline mb-3 text-center">{eyebrow}</p>
          <h2 id="faq-heading" className="mb-8 text-center font-heading text-display-sm font-bold text-primary">{heading}</h2>
          <div className="space-y-3">
            {faqs.map(f => (
              <details key={f.q} className="group rounded-xl border border-border bg-white open:border-gold open:shadow-card-hover transition-all">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-6 text-left font-heading text-heading-sm font-semibold text-primary marker:hidden">
                  <h3 className="font-heading text-heading-sm font-semibold">{f.q}</h3>
                  <span className="shrink-0 text-2xl text-gold transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <div className="px-6 pb-6 text-body leading-relaxed text-foreground-muted">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
