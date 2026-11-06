import { getListings } from '@/lib/supabase';

const LABEL: Record<string, string> = {
  retail: 'Retail', office: 'Office', 'medical office': 'Medical office', warehouse: 'Industrial / warehouse',
  industrial: 'Industrial / warehouse', flex: 'Flex', land: 'Land', 'mixed-use': 'Mixed-use',
};

/** Live count of CRECO's own active listings, by property type. Server-rendered so crawlers and AI engines read it; refreshes with the page (ISR). */
export async function ListingsSnapshot() {
  let rows: Awaited<ReturnType<typeof getListings>> = [];
  try { rows = await getListings('active'); } catch { return null; }
  if (!rows.length) return null;
  const by = new Map<string, { n: number; sf: number }>();
  for (const l of rows) {
    const k = LABEL[String(l.property_type).toLowerCase()] ?? String(l.property_type);
    const cur = by.get(k) ?? { n: 0, sf: 0 };
    cur.n += 1; cur.sf += l.available_sqft ?? l.sqft ?? 0;
    by.set(k, cur);
  }
  const total = rows.length;
  const asOf = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Chicago' });
  return (
    <section aria-labelledby="creco-inventory" className="mt-10 rounded-2xl border border-border bg-white p-6 sm:p-8">
      <h2 id="creco-inventory" className="font-heading text-heading-lg font-bold text-primary">CRECO listings right now</h2>
      <p className="mt-2 text-body-sm text-foreground-muted">
        {total} active {total === 1 ? 'listing' : 'listings'} on crecotx.com as of {asOf}. These are our own current availabilities, counted live from our listings database, not a market-wide survey.
      </p>
      <ul className="mt-4 divide-y divide-border/60">
        {[...by.entries()].sort((a, b) => b[1].n - a[1].n).map(([k, v]) => (
          <li key={k} className="flex items-baseline justify-between gap-4 py-2 text-body-sm">
            <span className="font-semibold text-primary">{k}</span>
            <span className="text-foreground-muted">{v.n} {v.n === 1 ? 'listing' : 'listings'}{v.sf ? ` · ${v.sf.toLocaleString('en-US')} SF` : ''}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
