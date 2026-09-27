/**
 * The "where does this sit" strip — a listing or service page pointing back up
 * at the city and asset hubs it belongs to.
 *
 * Deliberately quiet: one line of small links on the page's own ground, not a
 * card or a band. It exists to close an internal-linking gap, and it should
 * read like a breadcrumb trail rather than another call to action competing
 * with the inquiry form.
 */

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import type { HubLink } from '@/lib/hub-links';

export function HubLinks({
  links,
  label,
  className = 'border-t border-border bg-background-cream py-6',
}: {
  links: HubLink[];
  label: string;
  className?: string;
}) {
  if (links.length === 0) return null;
  return (
    <section className={className} aria-label={label}>
      <Container>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-caption uppercase tracking-widest text-foreground-muted">{label}</span>
          {links.map((l, i) => (
            <span key={l.href} className="inline-flex items-center gap-2">
              {i > 0 && <span aria-hidden="true" className="text-border">·</span>}
              <Link
                href={l.href}
                className="inline-flex min-h-[44px] items-center text-body-sm font-semibold text-gold-dark hover:underline md:min-h-0"
              >
                {l.label}
              </Link>
            </span>
          ))}
        </div>
      </Container>
    </section>
  );
}
