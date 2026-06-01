import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

/**
 * Visible breadcrumb navigation. Pairs with the BreadcrumbList JSON-LD
 * already emitted by detail pages (listings, markets, guides, insights).
 *
 * Why visible breadcrumbs matter for SEO in 2026:
 * - Google parses visible breadcrumbs from the HTML even when schema
 *   is present; the two together are a stronger signal than schema
 *   alone (Google explicitly recommends matching them).
 * - LLM crawlers (ChatGPT/Perplexity/Claude) frequently extract the
 *   page's location in the site hierarchy from the visible breadcrumb
 *   bar — schema parsing varies between LLMs but visible text always
 *   parses.
 * - Click-through on internal pages improves when users can jump up a
 *   level without hunting in the header. Small UX win on every visit.
 *
 * Shape:
 *   <Breadcrumbs items={[
 *     { label: 'Guides', href: '/guides' },
 *     { label: guide.title },  // last item: current page, no href
 *   ]} />
 *
 * "Home" is rendered automatically as the first crumb — callers
 * shouldn't include it. The last crumb represents the current page
 * and renders without a link.
 */

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({
  items,
  className = '',
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  const allItems: BreadcrumbItem[] = [{ label: 'Home', href: '/' }, ...items];
  return (
    <nav aria-label="Breadcrumb" className={`text-caption text-foreground-muted ${className}`}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        {allItems.map((item, idx) => {
          const isLast = idx === allItems.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="inline-flex items-center gap-1.5">
              {idx > 0 && (
                <ChevronRight
                  className="h-3 w-3 text-foreground-subtle shrink-0"
                  aria-hidden="true"
                />
              )}
              {isLast || !item.href ? (
                <span
                  className="text-foreground truncate max-w-[260px] sm:max-w-none"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-primary transition-colors truncate max-w-[160px] sm:max-w-none"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
