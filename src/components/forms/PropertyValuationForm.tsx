'use client';

/**
 * Property valuation form for /property-valuation — a two-step lead funnel.
 *
 *   1. About the property (≈20 seconds, no financials required): address,
 *      type, location, size, and how it's used. Rent only if it's leased.
 *   2. "Where should Zack send your valuation?" — name + email (phone
 *      optional). Submitting creates the lead (/api/leads,
 *      source='valuation-request': speed-to-lead task, alerts, confirmation).
 *   3. The payoff: the instant range when the inputs support one, plus the
 *      promise of a same-day Broker Opinion of Value from Zack.
 *
 * Why it changed (Oct 2026): the old version showed the range with no
 * contact info and asked for NOI / gross income / SF + rent first. Since
 * April: 78 visitors → 28 started → 13 got a number → 0 left contact info.
 * Half the starters quit at the income fields (owner-users, vacant buildings
 * and land have none), and everyone who got a number left with it.
 */

import { useState } from 'react';
import { VALUATION_DISCLAIMER } from '@/lib/valuation-copy';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, TrendingUp } from 'lucide-react';
import { getRecaptchaToken } from './Recaptcha';
import { Honeypot } from './Honeypot';
import {
  CAP_RATE_BANDS, valueProperty,
  type PropertyType, type SubmarketTier, type ValuationResult,
} from '@/lib/valuation';
import { trackEvent } from '@/lib/analytics';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'retail',      label: 'Retail' },
  { value: 'industrial',  label: 'Industrial / Warehouse' },
  { value: 'office',      label: 'Office' },
  { value: 'flex',        label: 'Flex' },
  { value: 'mixed-use',   label: 'Mixed-Use' },
  { value: 'multifamily', label: 'Multifamily' },
  { value: 'land',        label: 'Land' },
];

/** Plain-language locations, mapped onto the valuation tiers. */
const LOCATIONS: { value: string; label: string; tier: SubmarketTier }[] = [
  { value: 'sa-inside',  label: 'San Antonio — inside Loop 1604', tier: 'secondary' },
  { value: 'sa-outside', label: 'San Antonio area — outside 1604', tier: 'secondary' },
  { value: 'hill',       label: 'Hill Country — Boerne, Fair Oaks Ranch, Bulverde, Comfort…', tier: 'tertiary' },
  { value: 'tx-metro',   label: 'Austin, Dallas–Fort Worth or Houston', tier: 'secondary' },
  { value: 'tx-other',   label: 'Elsewhere in Texas', tier: 'tertiary' },
];

const USAGE = [
  { value: 'leased', label: 'Leased to tenants' },
  { value: 'owner',  label: 'I occupy it' },
  { value: 'vacant', label: 'Vacant' },
  { value: 'land',   label: 'Land' },
] as const;
type Usage = typeof USAGE[number]['value'];

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const input = 'w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold-dark focus:ring-2 focus:ring-gold/30';
const labelCls = 'mb-1.5 block text-caption uppercase tracking-widest text-foreground-muted';

export function PropertyValuationForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 — the property
  const [address, setAddress] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('retail');
  const [location, setLocation] = useState(LOCATIONS[0].value);
  const [totalSf, setTotalSf] = useState('');
  const [usage, setUsage] = useState<Usage>('leased');
  const [annualRent, setAnnualRent] = useState('');
  const [stepError, setStepError] = useState<string | null>(null);

  // Step 2 — the person
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  const [result, setResult] = useState<ValuationResult | null>(null);

  const tier = LOCATIONS.find(l => l.value === location)?.tier ?? 'secondary';
  const locationLabel = LOCATIONS.find(l => l.value === location)?.label ?? '';
  const typeLabel = PROPERTY_TYPES.find(p => p.value === propertyType)?.label ?? propertyType;

  function toStep2() {
    setStepError(null);
    if (!address.trim()) {
      setStepError('Add the property address so Zack can pull the right comps.');
      return;
    }
    trackEvent('valuation_step1_completed', { property_type: propertyType, location, usage, has_rent: Boolean(annualRent) });
    setStep(2);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step === 1) { toStep2(); return; }
    if (step !== 2) return;
    setLeadError(null);
    setSubmitting(true);
    try {
      // The instant range, when the inputs support one (leased + rent known).
      const gross = usage === 'leased' && annualRent ? Number(annualRent) : undefined;
      const r = gross ? valueProperty({ propertyType, submarketTier: tier, grossIncome: gross }) : null;

      const fd = new FormData(e.currentTarget);
      const honeypot = (fd.get('website') as string) ?? '';
      const formRenderedAt = Number(fd.get('form_rendered_at')) || undefined;
      const recaptchaToken = await getRecaptchaToken('property_valuation');

      const summary = [
        `Address: ${address.trim()}`,
        `Property type: ${typeLabel}`,
        `Location: ${locationLabel}`,
        `How it's used: ${USAGE.find(u => u.value === usage)?.label}`,
        totalSf ? `Size: ${Number(totalSf).toLocaleString()} SF` : null,
        gross ? `Annual rent collected: ${currency.format(gross)}` : null,
        r ? `\nInstant range shown: ${currency.format(r.low)} – ${currency.format(r.high)} (midpoint ${currency.format(r.midpoint)})` : null,
        r ? `Cap rate range: ${(r.capRateRange.low * 100).toFixed(2)}% – ${(r.capRateRange.high * 100).toFixed(2)}%` : null,
      ].filter(Boolean).join('\n');

      const { leadPayloadFields, identifyLead } = await import('@/lib/analytics');
      identifyLead(leadEmail, leadName.trim() || null, 'valuation-request');
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadName.trim(),
          email: leadEmail,
          phone: leadPhone,
          message: summary,
          property_interest: address.trim(),
          source: 'valuation-request',
          recaptchaToken,
          website: honeypot,
          form_rendered_at: formRenderedAt,
          ...leadPayloadFields(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not submit request');
      }
      setResult(r);
      if (r) {
        trackEvent('valuation_calculated', {
          property_type: propertyType, submarket_tier: tier,
          midpoint_bucket: r.midpoint >= 10_000_000 ? '10M+' : r.midpoint >= 5_000_000 ? '5M-10M' : r.midpoint >= 2_000_000 ? '2M-5M' : r.midpoint >= 1_000_000 ? '1M-2M' : r.midpoint >= 500_000 ? '500K-1M' : 'under-500K',
        });
      }
      trackEvent('valuation_lead_submitted', { property_type: propertyType, location, usage, has_phone: Boolean(leadPhone.trim()), got_range: Boolean(r) });
      setStep(3);
    } catch (err) {
      setLeadError((err as Error).message);
      trackEvent('valuation_lead_failed', { reason: (err as Error).message?.slice(0, 80) });
    } finally {
      setSubmitting(false);
    }
  }

  const band = CAP_RATE_BANDS[propertyType];

  return (
    <form onSubmit={submit} className="space-y-5" data-lead-form="valuation" data-surface="property-valuation" noValidate={step === 1}>
      <Honeypot />

      <div className="flex items-center gap-3" aria-live="polite">
        <div className="flex gap-1.5" aria-hidden>
          {[1, 2, 3].map(n => <span key={n} className={`h-1.5 w-8 rounded-full ${n <= step ? 'bg-gold' : 'bg-border'}`} />)}
        </div>
        <span className="text-caption font-semibold uppercase tracking-widest text-foreground-muted">
          Step {step} of 3 · {step === 1 ? 'Your property' : step === 2 ? 'Where to send it' : 'Your value'}
        </span>
      </div>

      {step === 1 && (
        <>
          <label className="block">
            <span className={labelCls}>Property address *</span>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} autoComplete="street-address" placeholder="123 Main St, Boerne" className={input} />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>Property type</span>
              <select value={propertyType} onChange={e => setPropertyType(e.target.value as PropertyType)} className={input}>
                {PROPERTY_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>Size (SF, optional)</span>
              <input type="number" inputMode="numeric" min="0" value={totalSf} onChange={e => setTotalSf(e.target.value)} placeholder="e.g. 8,000" className={input} />
            </label>
          </div>
          <label className="block">
            <span className={labelCls}>Location</span>
            <select value={location} onChange={e => setLocation(e.target.value)} className={input}>
              {LOCATIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </label>
          <div>
            <span className={labelCls}>How is it used?</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="How is the property used">
              {USAGE.map(u => (
                <button key={u.value} type="button" role="radio" aria-checked={usage === u.value} onClick={() => setUsage(u.value)}
                  className={`min-h-[44px] rounded-lg border-2 px-3 py-2 text-body-sm font-semibold transition-colors ${usage === u.value ? 'border-gold bg-gold/5 text-primary' : 'border-border bg-white text-primary hover:border-gold/50'}`}>
                  {u.label}
                </button>
              ))}
            </div>
          </div>
          {usage === 'leased' && (
            <label className="block">
              <span className={labelCls}>Annual rent you collect (optional — gets you an instant range)</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">$</span>
                <input type="number" inputMode="numeric" min="0" value={annualRent} onChange={e => setAnnualRent(e.target.value)} placeholder="e.g. 180,000" className={`${input} pl-7`} />
              </div>
            </label>
          )}
          {stepError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-body-sm text-destructive">{stepError}</p>}
          <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3.5 text-body font-bold text-primary shadow-sm hover:bg-gold-light">
            Next: get my value <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-center text-caption text-foreground-muted">About 20 seconds · free · no obligation</p>
        </>
      )}

      {step === 2 && (
        <>
          <div>
            <h3 className="font-heading text-heading-sm font-bold text-primary">Where should Zack send your valuation?</h3>
            <p className="mt-1 text-body-sm text-foreground-muted">
              Zachary A. Stovall, CRECO&apos;s broker/owner, prepares a Broker Opinion of Value for <span className="font-semibold text-primary">{address.trim()}</span> from real comparable sales — usually the same business day.
              {usage === 'leased' && annualRent ? ' You’ll also see an instant range on the next screen.' : ''}
            </p>
          </div>
          <label className="block">
            <span className={labelCls}>Your name *</span>
            <input type="text" required autoComplete="name" value={leadName} onChange={e => setLeadName(e.target.value)} className={input} />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>Email *</span>
              <input type="email" required autoComplete="email" inputMode="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} className={input} />
            </label>
            <label className="block">
              <span className={labelCls}>Phone (for a quick 5-minute call)</span>
              <input type="tel" autoComplete="tel" inputMode="tel" value={leadPhone} onChange={e => setLeadPhone(e.target.value)} className={input} />
            </label>
          </div>
          {leadError && <p role="alert" className="text-body-sm text-destructive">{leadError}</p>}
          <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3.5 text-body font-bold text-primary shadow-sm hover:bg-gold-light disabled:opacity-60">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <>Get my property value <ArrowRight className="h-4 w-4" /></>}
          </button>
          <div className="flex items-center justify-between text-caption text-foreground-muted">
            <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-1 font-semibold text-gold-dark hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
            <span>Private · never shared or sold</span>
          </div>
        </>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div className="rounded-lg border border-green-200 bg-green-50 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-green-700" />
              <div>
                <p className="font-heading text-heading-sm font-bold text-green-900">Zack has your request.</p>
                <p className="mt-1 text-body-sm text-green-800">
                  He&apos;ll prepare your Broker Opinion of Value for {address.trim()} and reach out {leadPhone.trim() ? 'by phone' : 'by email'} — usually the same business day. A confirmation is on its way to your inbox.
                </p>
              </div>
            </div>
          </div>

          {result ? (
            <div className="form-success-box space-y-4 bg-gradient-to-br from-gold/5 to-transparent">
              <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-gold" /><p className="overline text-gold">Your instant preliminary range</p></div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><p className="text-caption uppercase tracking-widest text-foreground-muted">Low</p><p className="mt-1 font-heading text-heading-md font-bold text-primary sm:text-display-sm">{currency.format(result.low)}</p></div>
                <div className="border-x border-gold/20"><p className="text-caption uppercase tracking-widest text-gold-dark">Midpoint</p><p className="mt-1 font-heading text-heading-md font-bold text-gold-dark sm:text-display-sm">{currency.format(result.midpoint)}</p></div>
                <div><p className="text-caption uppercase tracking-widest text-foreground-muted">High</p><p className="mt-1 font-heading text-heading-md font-bold text-primary sm:text-display-sm">{currency.format(result.high)}</p></div>
              </div>
              <p className="text-caption italic text-foreground-muted">{result.methodology}</p>
              <p className="text-caption text-foreground-muted">⚠️ {VALUATION_DISCLAIMER} Zack&apos;s Broker Opinion of Value replaces this with real comps.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-white p-5 text-body-sm text-foreground-muted">
              <p className="font-semibold text-primary">What drives value for {typeLabel.toLowerCase()} {usage === 'land' ? '' : 'property '}in this market</p>
              <p className="mt-2">
                {usage === 'leased'
                  ? `Leased ${typeLabel.toLowerCase()} typically trades on its income at roughly ${(band.low * 100).toFixed(1)}–${(band.high * 100).toFixed(1)}% cap rates, adjusted for tenant credit and lease term.`
                  : usage === 'land' || propertyType === 'land'
                    ? 'Land trades on recent comparable sales — frontage, utilities, zoning and access drive the number.'
                    : 'Owner-occupied and vacant buildings trade on comparable sales and what the space would lease for — Zack prices both.'}
              </p>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
