'use client';

/**
 * Property valuation form for /property-valuation.
 *
 * Two-stage UX:
 *   1. Owner fills in property + (any of) NOI / gross income / SF + rent
 *   2. Click "Calculate" — we run valueProperty() locally and reveal the
 *      preliminary range INLINE without requiring contact info first. This
 *      removes the "I have to give them my email to see anything" friction
 *      that kills these tools.
 *   3. THEN a "Get the full broker valuation" CTA captures their info via
 *      /api/leads with source='valuation-request' (the lead-capture step).
 *
 * Even owners who skip the contact step are useful — we still know they
 * visited a high-intent page (analytics).
 */

import { useState } from 'react';
import { ArrowRight, Calculator, CheckCircle, Loader2, TrendingUp } from 'lucide-react';
import { getRecaptchaToken } from './Recaptcha';
import { Honeypot } from './Honeypot';
import {
  CAP_RATE_BANDS, SUBMARKETS_BY_TIER, valueProperty,
  type PropertyType, type SubmarketTier, type ValuationResult,
} from '@/lib/valuation';
import { trackEvent } from '@/lib/analytics';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'industrial',  label: 'Industrial / Warehouse' },
  { value: 'retail',      label: 'Retail' },
  { value: 'office',      label: 'Office' },
  { value: 'flex',        label: 'Flex' },
  { value: 'mixed-use',   label: 'Mixed-Use' },
  { value: 'multifamily', label: 'Multifamily' },
  { value: 'land',        label: 'Land' },
];

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function PropertyValuationForm() {
  // Property inputs
  const [propertyType, setPropertyType] = useState<PropertyType>('industrial');
  const [submarketTier, setSubmarketTier] = useState<SubmarketTier>('secondary');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [totalSf, setTotalSf] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [occupancy, setOccupancy] = useState('95');
  const [noi, setNoi] = useState('');
  const [grossIncome, setGrossIncome] = useState('');
  const [rentPerSf, setRentPerSf] = useState('');

  // Result + lead-capture stage
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Lead capture
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadNotes, setLeadNotes] = useState('');
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setCalcError(null);

    const noiNum = noi ? Number(noi) : undefined;
    const grossNum = grossIncome ? Number(grossIncome) : undefined;
    const sfNum = totalSf ? Number(totalSf) : undefined;
    const rentNum = rentPerSf ? Number(rentPerSf) : undefined;
    const occNum = occupancy ? Number(occupancy) / 100 : undefined;

    if (!noiNum && !grossNum && !(sfNum && rentNum)) {
      setCalcError(
        "Need at least one of: NOI, gross income, or square footage + rent per SF. Without those, there's nothing to estimate from.",
      );
      setResult(null);
      return;
    }

    const r = valueProperty({
      propertyType,
      submarketTier,
      noi: noiNum,
      grossIncome: grossNum,
      totalSf: sfNum,
      rentPerSfYear: rentNum,
      occupancy: occNum,
    });

    if (!r) {
      setCalcError("Couldn't compute a range from those inputs.");
      setResult(null);
      trackEvent('valuation_calculate_failed', { property_type: propertyType, submarket_tier: submarketTier });
      return;
    }
    setResult(r);
    setShowLeadForm(false);
    setLeadSubmitted(false);
    trackEvent('valuation_calculated', {
      property_type: propertyType,
      submarket_tier: submarketTier,
      // Bucket the midpoint so we can see distribution without leaking raw values
      midpoint_bucket: r.midpoint >= 10_000_000 ? '10M+'
        : r.midpoint >= 5_000_000 ? '5M-10M'
        : r.midpoint >= 2_000_000 ? '2M-5M'
        : r.midpoint >= 1_000_000 ? '1M-2M'
        : r.midpoint >= 500_000 ? '500K-1M'
        : 'under-500K',
      noi_known: Boolean(noi),
      gross_income_known: Boolean(grossIncome),
      sf_rent_known: Boolean(totalSf && rentPerSf),
    });
  }

  async function handleSubmitLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLeadError(null);
    setSubmittingLead(true);
    try {
      const recaptchaToken = await getRecaptchaToken('property_valuation');
      const honeypot = (new FormData(e.currentTarget).get('website') as string) ?? '';

      const summaryParts = [
        `Property type: ${propertyType}`,
        `Submarket tier: ${submarketTier}`,
        address ? `Address: ${address}${city ? ', ' + city : ''}` : null,
        totalSf ? `Total SF: ${Number(totalSf).toLocaleString()}` : null,
        yearBuilt ? `Year built: ${yearBuilt}` : null,
        occupancy ? `Occupancy: ${occupancy}%` : null,
        noi ? `NOI: ${currency.format(Number(noi))}` : null,
        grossIncome ? `Gross income: ${currency.format(Number(grossIncome))}` : null,
        rentPerSf ? `Rent: $${rentPerSf}/SF/yr` : null,
        result ? `\nPreliminary valuation: ${currency.format(result.low)} – ${currency.format(result.high)} (midpoint ${currency.format(result.midpoint)})` : null,
        result ? `NOI used: ${currency.format(result.noiUsed)}` : null,
        result ? `Cap rate range: ${(result.capRateRange.low * 100).toFixed(2)}% – ${(result.capRateRange.high * 100).toFixed(2)}%` : null,
        leadNotes ? `\nNotes from owner: ${leadNotes}` : null,
      ].filter(Boolean) as string[];

      const { readUtmsFromCookie } = await import('@/lib/analytics');
      const attribution = readUtmsFromCookie();
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadName,
          email: leadEmail,
          phone: leadPhone,
          message: summaryParts.join('\n'),
          property_interest: address ? `${address}${city ? ', ' + city : ''}` : `${propertyType} property`,
          source: 'valuation-request',
          recaptchaToken,
          website: honeypot,
          ...attribution,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not submit request');
      }
      setLeadSubmitted(true);
      trackEvent('valuation_lead_submitted', {
        property_type: propertyType,
        submarket_tier: submarketTier,
      });
    } catch (err) {
      setLeadError((err as Error).message);
      trackEvent('valuation_lead_failed', { reason: (err as Error).message?.slice(0, 80) });
    } finally {
      setSubmittingLead(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Step 1 — Calculate form */}
      <form onSubmit={handleCalculate} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1.5">Property type *</span>
            <select
              value={propertyType}
              onChange={e => setPropertyType(e.target.value as PropertyType)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
            >
              {PROPERTY_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1.5">Submarket tier *</span>
            <select
              value={submarketTier}
              onChange={e => setSubmarketTier(e.target.value as SubmarketTier)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
            >
              {SUBMARKETS_BY_TIER.map(t => (
                <option key={t.tier} value={t.tier}>{t.label} — {t.markets.slice(0, 3).join(', ')}…</option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1.5">Address (optional)</span>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="123 Main St"
                className="col-span-2 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
              />
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="City"
                className="col-span-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
              />
            </div>
          </label>
        </div>

        <div className="rounded-lg bg-background-cream/60 border border-border p-4 space-y-4">
          <p className="text-caption uppercase tracking-widest text-foreground-muted">
            Income approach (preferred — fill any of these)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-caption text-foreground-muted mb-1">Annual NOI</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">$</span>
                <input type="number" min="0" step="1" value={noi} onChange={e => setNoi(e.target.value)} placeholder="e.g. 240000" className="w-full rounded-lg border border-border bg-white pl-7 pr-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold" />
              </div>
            </label>
            <label className="block">
              <span className="block text-caption text-foreground-muted mb-1">Or annual gross income</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">$</span>
                <input type="number" min="0" step="1" value={grossIncome} onChange={e => setGrossIncome(e.target.value)} placeholder="e.g. 360000" className="w-full rounded-lg border border-border bg-white pl-7 pr-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold" />
              </div>
            </label>
          </div>
          <p className="text-caption text-foreground-muted italic">If you don't have NOI/income handy, fill the rent-based fields below instead.</p>
        </div>

        <div className="rounded-lg bg-background-cream/60 border border-border p-4 space-y-4">
          <p className="text-caption uppercase tracking-widest text-foreground-muted">
            Rent-based fallback
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="block">
              <span className="block text-caption text-foreground-muted mb-1">Total SF</span>
              <input type="number" min="0" step="1" value={totalSf} onChange={e => setTotalSf(e.target.value)} placeholder="e.g. 12000" className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold" />
            </label>
            <label className="block">
              <span className="block text-caption text-foreground-muted mb-1">Rent $/SF/yr</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">$</span>
                <input type="number" min="0" step="0.01" value={rentPerSf} onChange={e => setRentPerSf(e.target.value)} placeholder="e.g. 18" className="w-full rounded-lg border border-border bg-white pl-7 pr-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold" />
              </div>
            </label>
            <label className="block">
              <span className="block text-caption text-foreground-muted mb-1">Occupancy %</span>
              <input type="number" min="0" max="100" step="1" value={occupancy} onChange={e => setOccupancy(e.target.value)} placeholder="95" className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold" />
            </label>
            <label className="block">
              <span className="block text-caption text-foreground-muted mb-1">Year built</span>
              <input type="number" min="1900" max="2030" step="1" value={yearBuilt} onChange={e => setYearBuilt(e.target.value)} placeholder="—" className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold" />
            </label>
          </div>
        </div>

        {calcError && (
          <p className="text-body-sm text-destructive bg-destructive/5 border border-destructive/30 rounded-lg p-3">{calcError}</p>
        )}

        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-body-sm font-semibold text-white hover:bg-primary/90"
        >
          <Calculator className="h-4 w-4" /> Calculate preliminary value
        </button>
      </form>

      {/* Step 2 — Result */}
      {result && (
        <div className="form-success-box bg-gradient-to-br from-gold/5 to-transparent space-y-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gold" />
            <p className="overline text-gold">Preliminary valuation range</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-caption uppercase tracking-widest text-foreground-muted">Low</p>
              <p className="mt-1 font-heading text-heading-md sm:text-display-sm font-bold text-primary">{currency.format(result.low)}</p>
            </div>
            <div className="border-x border-gold/20">
              <p className="text-caption uppercase tracking-widest text-gold-dark">Midpoint</p>
              <p className="mt-1 font-heading text-heading-md sm:text-display-sm font-bold text-gold-dark">{currency.format(result.midpoint)}</p>
            </div>
            <div>
              <p className="text-caption uppercase tracking-widest text-foreground-muted">High</p>
              <p className="mt-1 font-heading text-heading-md sm:text-display-sm font-bold text-primary">{currency.format(result.high)}</p>
            </div>
          </div>

          <div className="rounded-lg bg-white border border-border p-4 text-body-sm space-y-2">
            <p className="text-foreground-muted"><span className="font-semibold text-primary">NOI used:</span> {currency.format(result.noiUsed)}/year</p>
            <p className="text-foreground-muted"><span className="font-semibold text-primary">Cap rate range:</span> {(result.capRateRange.low * 100).toFixed(2)}% – {(result.capRateRange.high * 100).toFixed(2)}%</p>
            <p className="text-foreground-muted text-caption italic">{result.methodology}</p>
          </div>

          <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
            <p className="text-caption text-foreground-muted">
              ⚠️ This is a preliminary range, not an appraisal. The actual value depends on lease structure, tenant credit, condition, deferred capex, comparable transactions, and market timing — all of which need a broker walkthrough. Use this number to ground the conversation, not to set a list price.
            </p>
          </div>

          {/* CTA to capture as lead */}
          {!showLeadForm && !leadSubmitted && (
            <button
              type="button"
              onClick={() => {
                setShowLeadForm(true);
                trackEvent('valuation_lead_form_opened', { property_type: propertyType });
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3.5 text-body-sm font-semibold text-primary hover:bg-gold-light"
            >
              Get the full broker valuation <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {showLeadForm && !leadSubmitted && (
            <form onSubmit={handleSubmitLead} className="space-y-4 rounded-lg bg-white border border-border p-5">
              <Honeypot />
              <p className="text-body-sm text-primary font-semibold">Send me the full broker valuation</p>
              <p className="text-caption text-foreground-muted -mt-2">
                A senior CRECO broker will review your inputs, pull comps from active deals, and follow up within one business day. No charge, no obligation, no sales pitch unless you ask for one.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" required value={leadName} onChange={e => setLeadName(e.target.value)} placeholder="Your name" className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold" />
                <input type="email" required value={leadEmail} onChange={e => setLeadEmail(e.target.value)} placeholder="you@email.com" className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold" />
              </div>
              <input type="tel" required value={leadPhone} onChange={e => setLeadPhone(e.target.value)} placeholder="Phone" className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold" />
              <textarea value={leadNotes} onChange={e => setLeadNotes(e.target.value)} rows={3} placeholder="Anything else we should know? (timeline, current tenant situation, what you're considering)" className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold" />
              {leadError && <p className="text-body-sm text-destructive">{leadError}</p>}
              <button type="submit" disabled={submittingLead} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">
                {submittingLead ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <>Request full valuation <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}

          {leadSubmitted && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-5 text-center">
              <CheckCircle className="mx-auto h-10 w-10 text-green-700 mb-2" />
              <p className="font-heading text-heading-sm font-bold text-green-900 mb-1">Request received.</p>
              <p className="text-body-sm text-green-800">
                A CRECO broker will follow up within one business day. Check your inbox for confirmation.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Reference cap rates (always shown — educational + builds credibility) */}
      <details className="rounded-lg border border-border bg-white p-4">
        <summary className="cursor-pointer text-body-sm font-semibold text-primary list-none flex items-center justify-between">
          <span>Reference cap rates by property type (mid-2026 Texas)</span>
          <span className="text-gold text-xl leading-none">+</span>
        </summary>
        <div className="mt-4 space-y-2 text-body-sm">
          {Object.entries(CAP_RATE_BANDS).map(([type, band]) => (
            <div key={type} className="flex justify-between border-b border-border pb-1.5 last:border-0">
              <span className="text-foreground-muted capitalize">{type.replace('-', ' ')}</span>
              <span className="font-mono text-primary">{(band.low * 100).toFixed(2)}% – {(band.high * 100).toFixed(2)}%</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-caption text-foreground-muted">
          These are stabilized-asset ranges. Value-add, distressed, or unique-use properties trade outside the band.
        </p>
      </details>
    </div>
  );
}
