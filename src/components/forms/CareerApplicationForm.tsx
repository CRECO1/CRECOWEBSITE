'use client';

/**
 * Agent application form for /careers. Posts to /api/inquiry with
 * path='agent', which routes to a "Agent Application" subject in the
 * broker's inbox so it triages cleanly alongside (and separately from)
 * tenant/buyer/seller leads.
 *
 * Captures the things a hiring broker actually needs to decide whether
 * to schedule a call: license status, experience, specialties, primary
 * market, why CRECO. Light enough to fill out in 90 seconds — most of
 * the depth happens in the first phone call.
 */

import { useState } from 'react';
import { ArrowRight, CheckCircle, Briefcase } from 'lucide-react';
import { getRecaptchaToken } from './Recaptcha';
import { Honeypot } from './Honeypot';

const LICENSE_STATUSES = [
  'Active TX real estate license',
  'License pending',
  'Out-of-state license, willing to transfer',
  'Not yet licensed — interested in pursuing',
];

const EXPERIENCE_RANGES = [
  'New to the industry',
  '1–3 years',
  '3–7 years',
  '7–15 years',
  '15+ years',
];

const SPECIALTIES = [
  'Tenant Representation',
  'Owner / Investor Representation',
  'Retail',
  'Industrial / Warehouse',
  'Office',
  'Land',
  'Investment Sales',
  'Property Management',
  'Development',
];

const PRIMARY_MARKETS = [
  'San Antonio',
  'Fair Oaks Ranch / Boerne',
  'Austin',
  'Houston',
  'Dallas–Fort Worth',
  'New Braunfels / Hill Country',
  'Other Texas',
];

export function CareerApplicationForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseStatus, setLicenseStatus] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [currentBrokerage, setCurrentBrokerage] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [primaryMarket, setPrimaryMarket] = useState('');
  const [whyCreco, setWhyCreco] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSpecialty(s: string) {
    setSpecialties(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const recaptchaToken = await getRecaptchaToken('submit_agent_application');
      const honeypot = (new FormData(e.currentTarget).get('website') as string) ?? '';
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'agent',
          name,
          email,
          phone,
          company: currentBrokerage,
          answers: {
            license_status: licenseStatus || null,
            license_number: licenseNumber || null,
            years_experience: yearsExperience || null,
            current_brokerage: currentBrokerage || null,
            specialties,
            primary_market: primaryMarket || null,
            why_creco: whyCreco || null,
            linkedin: linkedin || null,
          },
          recaptchaToken,
          website: honeypot,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not submit application');
      }
      setSubmitted(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-gold/30 bg-gold/5 p-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-gold mb-4" />
        <h2 className="font-heading text-heading-md font-bold text-primary mb-2">Application received.</h2>
        <p className="text-body text-foreground-muted max-w-md mx-auto">
          Thanks for your interest in joining CRECO. A principal will review your background and reach out to schedule a confidential conversation if there's a fit.
        </p>
        <p className="mt-4 text-body-sm text-foreground-muted">
          Want to talk now? Call <a href="tel:+12108173443" className="text-gold-dark hover:underline font-semibold">(210) 817-3443</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <Honeypot />

      {/* Identity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-body-sm font-semibold text-primary mb-1.5">Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-body-sm font-semibold text-primary mb-1.5">Email *</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
            placeholder="you@email.com"
          />
        </div>
        <div>
          <label className="block text-body-sm font-semibold text-primary mb-1.5">Phone *</label>
          <input
            type="tel"
            required
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
            placeholder="(210) 555-0100"
          />
        </div>
        <div>
          <label className="block text-body-sm font-semibold text-primary mb-1.5">LinkedIn (optional)</label>
          <input
            type="url"
            value={linkedin}
            onChange={e => setLinkedin(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
            placeholder="linkedin.com/in/your-profile"
          />
        </div>
      </div>

      {/* License */}
      <div>
        <label className="block text-body-sm font-semibold text-primary mb-2">License status *</label>
        <div className="space-y-2">
          {LICENSE_STATUSES.map(status => (
            <label
              key={status}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                licenseStatus === status ? 'border-gold bg-gold/5' : 'border-border bg-white hover:border-gold/50'
              }`}
            >
              <input
                type="radio"
                name="license_status"
                value={status}
                checked={licenseStatus === status}
                onChange={() => setLicenseStatus(status)}
                required
                className="text-gold focus:ring-gold"
              />
              <span className="text-body-sm text-primary">{status}</span>
            </label>
          ))}
        </div>
      </div>

      {/* TREC + experience + brokerage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-body-sm font-semibold text-primary mb-1.5">TREC license # <span className="text-foreground-muted font-normal">(if licensed)</span></label>
          <input
            type="text"
            value={licenseNumber}
            onChange={e => setLicenseNumber(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
            placeholder="e.g. 7654321"
          />
        </div>
        <div>
          <label className="block text-body-sm font-semibold text-primary mb-1.5">Years of experience</label>
          <select
            value={yearsExperience}
            onChange={e => setYearsExperience(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
          >
            <option value="">Select…</option>
            {EXPERIENCE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-body-sm font-semibold text-primary mb-1.5">Current brokerage <span className="text-foreground-muted font-normal">(or "none")</span></label>
          <input
            type="text"
            value={currentBrokerage}
            onChange={e => setCurrentBrokerage(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
            placeholder="Where you hang your license today"
          />
        </div>
      </div>

      {/* Specialties */}
      <div>
        <label className="block text-body-sm font-semibold text-primary mb-2">Areas of focus <span className="text-foreground-muted font-normal">(select any that apply)</span></label>
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map(s => {
            const selected = specialties.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpecialty(s)}
                className={`px-3 py-1.5 rounded-full text-body-sm font-medium border transition-colors ${
                  selected
                    ? 'bg-gold text-primary border-gold'
                    : 'bg-white text-foreground-muted border-border hover:border-gold hover:text-primary'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Market */}
      <div>
        <label className="block text-body-sm font-semibold text-primary mb-1.5">Primary market</label>
        <select
          value={primaryMarket}
          onChange={e => setPrimaryMarket(e.target.value)}
          className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
        >
          <option value="">Select…</option>
          {PRIMARY_MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Why CRECO */}
      <div>
        <label className="block text-body-sm font-semibold text-primary mb-1.5">Why CRECO?</label>
        <textarea
          value={whyCreco}
          onChange={e => setWhyCreco(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
          placeholder="Tell us what's drawing you to CRECO and what you'd want out of the next chapter of your career. The more specific, the better."
        />
      </div>

      {error && <p className="text-body-sm text-destructive">{error}</p>}

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between pt-2 border-t border-border">
        <p className="text-caption text-foreground-muted max-w-md flex items-center gap-1.5">
          <Briefcase className="h-3 w-3 text-gold shrink-0" />
          Your application stays confidential. We never contact your current brokerage without your say-so.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 whitespace-nowrap"
        >
          {submitting ? 'Submitting…' : <>Submit application <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
    </form>
  );
}
