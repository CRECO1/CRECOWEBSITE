'use client';

import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { CAP_RATE_BANDS, type PropertyType } from '@/lib/valuation';

/**
 * Free income-approach calculator: NOI ÷ cap rate, shown as a range using the
 * same cap-rate bands the valuation tool and the table below it run on. It is
 * plain arithmetic, so it needs no contact info; the broker opinion of value
 * (comps, lease review, condition) is the step it hands off to.
 */

const TYPES: { value: PropertyType; label: string }[] = [
  { value: 'industrial', label: 'Industrial / warehouse' },
  { value: 'retail', label: 'Retail' },
  { value: 'office', label: 'Office' },
  { value: 'flex', label: 'Flex' },
  { value: 'mixed-use', label: 'Mixed-use' },
  { value: 'multifamily', label: 'Multifamily' },
];

const usd = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M` : `$${Math.round(n / 1000).toLocaleString()}K`;

export function ValueEstimator() {
  const [type, setType] = useState<PropertyType>('industrial');
  const [noiText, setNoiText] = useState('');

  const noi = Number(noiText.replace(/[^0-9.]/g, ''));
  const band = CAP_RATE_BANDS[type];
  const range = useMemo(
    () => (noi > 0 ? { low: noi / band.high, high: noi / band.low } : null),
    [noi, band],
  );

  return (
    <section className="section-luxury bg-white" aria-labelledby="estimator-heading">
      <Container>
        <div className="mx-auto max-w-4xl">
          <p className="overline mb-3">Commercial property value calculator</p>
          <h2 id="estimator-heading" className="font-heading text-display-sm font-bold text-primary mb-4">
            Estimate your commercial property&apos;s value from its income
          </h2>
          <p className="mb-8 max-w-3xl text-body text-foreground-muted leading-relaxed">
            Most leased commercial property is valued as <strong>net operating income ÷ cap rate</strong>. Enter your
            annual NOI (rent collected minus operating expenses, before debt service) to see the range our cap-rate
            bands imply. Nothing to sign up for.
          </p>

          <div className="grid gap-6 rounded-2xl border border-border bg-background-cream p-6 sm:p-8 md:grid-cols-2">
            <div className="space-y-5">
              <label className="block">
                <span className="mb-1.5 block text-body-sm font-semibold text-primary">Property type</span>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as PropertyType)}
                  className="w-full rounded-lg border border-border bg-white px-4 py-3 text-body"
                >
                  {TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-body-sm font-semibold text-primary">Annual net operating income</span>
                <input
                  inputMode="numeric"
                  value={noiText}
                  onChange={e => setNoiText(e.target.value)}
                  placeholder="e.g. 200000"
                  className="w-full rounded-lg border border-border bg-white px-4 py-3 text-body"
                />
              </label>
              <p className="text-body-sm text-foreground-muted">
                Cap rate band used: {(band.low * 100).toFixed(1).replace(/\.0$/, '')}% to {(band.high * 100).toFixed(1).replace(/\.0$/, '')}%.
              </p>
            </div>

            <div className="flex flex-col justify-center rounded-xl bg-primary p-6 text-white" aria-live="polite">
              {range ? (
                <>
                  <p className="overline mb-2 text-gold">Indicated value range</p>
                  <p className="font-heading text-display-sm font-bold">{usd(range.low)} to {usd(range.high)}</p>
                  <p className="mt-3 text-body-sm text-white/70 leading-relaxed">
                    A starting point only. Lease terms, tenant credit, condition and recent comparable sales commonly
                    move the real number 10 to 20% either way.
                  </p>
                  <a
                    href="#valuation-form"
                    className="mt-5 inline-flex items-center gap-2 text-body-sm font-semibold text-gold hover:underline"
                  >
                    Get the real number from a broker <ArrowRight className="h-4 w-4" />
                  </a>
                </>
              ) : (
                <p className="text-body text-white/70 leading-relaxed">
                  Enter your annual NOI to see a range. Example: $200,000 of NOI at an 8% cap rate is worth $2.5 million.
                </p>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
