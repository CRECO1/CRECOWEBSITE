import { Container } from '@/components/ui/Container';
import { CAP_RATE_BANDS, type PropertyType } from '@/lib/valuation';

/**
 * Cap-rate bands by asset type — the same numbers the valuation tool runs on,
 * shown openly so an owner can see the assumption behind their range.
 *
 * These are CRECO's own estimates. No research provider or data service stands
 * behind them, and they are labelled that way on the page rather than dressed
 * up as market data — the same rule the market-data pages follow. If a figure
 * is ever sourced from a provider, name the provider next to it.
 */

const LABELS: Record<PropertyType, { name: string; drivers: string }> = {
  industrial: { name: 'Industrial / warehouse', drivers: 'Clear height, dock doors, power, location on a distribution corridor' },
  retail: { name: 'Retail', drivers: 'Tenant mix and credit, co-tenancy, traffic counts, visibility' },
  office: { name: 'Office', drivers: 'Class, submarket, lease term remaining, parking ratio, capex needs' },
  flex: { name: 'Flex', drivers: 'Office-to-warehouse ratio, divisibility, ceiling height' },
  'mixed-use': { name: 'Mixed-use', drivers: 'Income mix and stability, ground-floor tenancy, parking' },
  multifamily: { name: 'Multifamily', drivers: 'Unit mix, rent roll, expense ratio, deferred maintenance' },
  land: { name: 'Land', drivers: 'Entitlements, utilities, frontage, path of growth — trades on comps, not cap rate' },
};

const ORDER: PropertyType[] = ['industrial', 'retail', 'office', 'flex', 'mixed-use', 'multifamily', 'land'];

const pct = (n: number) => `${(n * 100).toFixed(1).replace(/\.0$/, '')}%`;

export function CapRateTable({ asOf = 'September 2026' }: { asOf?: string }) {
  return (
    <section className="section-luxury bg-white" aria-labelledby="cap-rates-heading">
      <Container>
        <div className="mx-auto max-w-4xl">
          <p className="overline mb-3">The assumption behind your number</p>
          <h2 id="cap-rates-heading" className="font-heading text-display-sm font-bold text-primary mb-4">
            Cap rate ranges by asset type
          </h2>
          <p className="mb-8 max-w-3xl text-body text-foreground-muted leading-relaxed">
            Value under the income approach is net operating income divided by a cap rate, so the cap rate is
            what moves your number most. These are the bands the tool applies to stabilized Texas assets before
            adjusting for submarket. A lower cap rate means a higher value for the same income.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-border/60">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-background-cream">
                  <th scope="col" className="px-5 py-3 text-caption font-semibold uppercase tracking-wider text-primary">Asset type</th>
                  <th scope="col" className="px-5 py-3 text-caption font-semibold uppercase tracking-wider text-primary whitespace-nowrap">Cap rate range</th>
                  <th scope="col" className="px-5 py-3 text-caption font-semibold uppercase tracking-wider text-primary">What moves it</th>
                </tr>
              </thead>
              <tbody>
                {ORDER.map(type => (
                  <tr key={type} className="border-t border-border/60">
                    <th scope="row" className="px-5 py-4 text-body-sm font-semibold text-primary">{LABELS[type].name}</th>
                    <td className="px-5 py-4 text-body-sm font-semibold text-gold-dark whitespace-nowrap">
                      {pct(CAP_RATE_BANDS[type].low)} – {pct(CAP_RATE_BANDS[type].high)}
                    </td>
                    <td className="px-5 py-4 text-body-sm text-foreground-muted">{LABELS[type].drivers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-5 text-body-sm leading-relaxed text-foreground-muted">
            <strong className="text-primary">CRECO estimate, as of {asOf}.</strong> These ranges are our own working
            figures for stabilized assets, based on what we see in Texas deals. They are not drawn from a
            third-party research provider or data service, have not been independently verified, and are
            approximate — published market reports may differ. Value-add, distressed, special-use and
            single-tenant net-lease properties regularly trade outside these bands, and the right cap rate for
            one specific building depends on its lease structure, tenant credit and condition.
          </p>
        </div>
      </Container>
    </section>
  );
}
