'use client';

import { useState } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle, Building2, Briefcase, Warehouse, Store, Layers, MapPin } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';

interface QuizStep {
  id: string;
  question: string;
  helper?: string;
  type: 'choice' | 'multi' | 'text' | 'number';
  placeholder?: string;
  options?: { label: string; value: string; icon?: any; description?: string }[];
}

const STEPS: QuizStep[] = [
  {
    id: 'space_type',
    question: 'What type of space are you looking for?',
    helper: 'Select all that apply.',
    type: 'multi',
    options: [
      { label: 'Office', value: 'office', icon: Briefcase, description: 'Class A/B office, executive suites, professional space' },
      { label: 'Warehouse / Industrial', value: 'warehouse', icon: Warehouse, description: 'Distribution, light/heavy industrial, dock-high' },
      { label: 'Flex', value: 'flex', icon: Layers, description: 'Mixed office + warehouse / showroom' },
      { label: 'Retail', value: 'retail', icon: Store, description: 'Strip center, freestanding, restaurant, storefront' },
      { label: 'Land', value: 'land', icon: MapPin, description: 'Raw or improved land for development' },
      { label: 'Not sure yet', value: 'unsure', icon: Building2, description: "We'll help you scope it" },
    ],
  },
  {
    id: 'transaction_type',
    question: 'Are you looking to lease or buy?',
    type: 'choice',
    options: [
      { label: 'Lease', value: 'lease', description: 'Short to long-term rental of the space' },
      { label: 'Buy', value: 'sale', description: 'Acquire the property outright' },
      { label: 'Either — I want options', value: 'both', description: 'Show me lease and sale opportunities' },
    ],
  },
  {
    id: 'size',
    question: 'How much space do you need?',
    helper: 'Approximate square footage. We\'ll help you refine.',
    type: 'choice',
    options: [
      { label: 'Under 2,500 SF', value: 'under-2500' },
      { label: '2,500 – 5,000 SF', value: '2500-5000' },
      { label: '5,000 – 15,000 SF', value: '5000-15000' },
      { label: '15,000 – 50,000 SF', value: '15000-50000' },
      { label: '50,000+ SF', value: '50000-plus' },
      { label: 'Not sure', value: 'unsure' },
    ],
  },
  {
    id: 'budget',
    question: 'What\'s your monthly budget?',
    helper: 'Total monthly occupancy cost (rent + estimated NNN, or mortgage payment).',
    type: 'choice',
    options: [
      { label: 'Under $2,500 / month', value: 'under-2500' },
      { label: '$2,500 – $5,000 / month', value: '2500-5000' },
      { label: '$5,000 – $10,000 / month', value: '5000-10000' },
      { label: '$10,000 – $25,000 / month', value: '10000-25000' },
      { label: '$25,000+ / month', value: '25000-plus' },
      { label: 'Not sure yet', value: 'unsure' },
    ],
  },
  {
    id: 'submarket',
    question: 'What area or zip codes are you targeting?',
    helper: 'Submarket name (e.g. Northwest, Downtown, Far West) or specific zip codes — comma separated. Leave blank if open.',
    type: 'text',
    placeholder: 'e.g. 78216, 78230, or "Northwest near 1604"',
  },
  {
    id: 'timeline',
    question: 'When do you need to be in?',
    type: 'choice',
    options: [
      { label: 'ASAP (within 30 days)', value: 'asap' },
      { label: '1 – 3 months', value: '1-3-months' },
      { label: '3 – 6 months', value: '3-6-months' },
      { label: '6 – 12 months', value: '6-12-months' },
      { label: 'Just exploring', value: 'exploring' },
    ],
  },
  {
    id: 'must_haves',
    question: 'Any specific requirements?',
    helper: 'Optional. Examples: dock doors, drive-in, 18\' clear height, 3-phase power, parking ratio, signage, ADA, kitchen, conference room.',
    type: 'text',
    placeholder: 'e.g. Two dock doors, 16\' clear, 480V 3-phase, fenced yard',
  },
];

type Answers = Record<string, string | string[]>;

export default function TenantNeedsPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [contactStep, setContactStep] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  function setValue(value: string) {
    if (current.type === 'multi') {
      const prev = (answers[current.id] as string[]) ?? [];
      const next = prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value];
      setAnswers(a => ({ ...a, [current.id]: next }));
    } else if (current.type === 'choice') {
      setAnswers(a => ({ ...a, [current.id]: value }));
      advance();
    } else {
      setAnswers(a => ({ ...a, [current.id]: value }));
    }
  }

  function advance() {
    if (step < STEPS.length - 1) {
      setTimeout(() => setStep(s => s + 1), 200);
    } else {
      setTimeout(() => setContactStep(true), 200);
    }
  }

  function isSelected(value: string) {
    const v = answers[current.id];
    return Array.isArray(v) ? v.includes(value) : v === value;
  }

  async function handleContact(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/tenant-needs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, company, email, phone, answers }),
    }).catch(() => {});
    setLoading(false);
    setDone(true);
  }

  if (done) {
    return (
      <>
        <Header variant="minimal" />
        <main className="min-h-screen pt-20 bg-background-cream">
          <Container className="py-20">
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <h1 className="mb-4 font-heading text-display-sm font-bold text-primary">
                We&apos;ve Got Your Requirements
              </h1>
              <p className="mb-8 text-body text-foreground-muted">
                A CRECO broker will reach out within one business day with vetted options that match your size, budget, and submarket. Expect 3–5 properties in the first email — not a flood.
              </p>
              <div className="rounded-xl bg-white p-6 shadow-card mb-8 text-left">
                <h3 className="font-heading text-heading font-semibold text-primary mb-4">Your Requirements</h3>
                <ul className="space-y-2">
                  {STEPS.map(s => {
                    const val = answers[s.id];
                    if (!val || (Array.isArray(val) && val.length === 0)) return null;
                    const display = Array.isArray(val) ? val.join(', ') : val;
                    return (
                      <li key={s.id} className="flex items-start gap-2 text-body-sm">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                        <span className="text-foreground-muted">{s.question.replace('?', '')}: <strong className="text-primary">{display}</strong></span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <Button size="lg" asChild>
                <a href="/listings">Browse Available Properties</a>
              </Button>
            </div>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  if (contactStep) {
    return (
      <>
        <Header variant="minimal" />
        <main className="min-h-screen pt-20 bg-background-cream">
          <Container className="py-16">
            <div className="mx-auto max-w-lg">
              <div className="mb-8 text-center">
                <Building2 className="mx-auto mb-4 h-10 w-10 text-gold" />
                <h2 className="font-heading text-display-sm font-bold text-primary mb-2">
                  Where should we send your matches?
                </h2>
                <p className="text-body text-foreground-muted">
                  A CRECO broker will email you vetted options within one business day.
                </p>
              </div>
              <form onSubmit={handleContact} className="space-y-4 bg-white rounded-2xl shadow-card p-8">
                <div>
                  <label className="label-readable">Your Name *</label>
                  <input required value={name} onChange={e => setName(e.target.value)} placeholder="First & Last Name" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
                <div>
                  <label className="label-readable">Company</label>
                  <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Logistics LLC" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
                <div>
                  <label className="label-readable">Email Address *</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
                <div>
                  <label className="label-readable">Phone *</label>
                  <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(210) 555-0000" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
                <p className="text-caption text-foreground-muted">
                  By submitting, you agree to be contacted by CRECO. We never share your information.
                </p>
                <Button type="submit" size="lg" fullWidth loading={loading}>
                  Send My Requirements
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
              <button
                type="button"
                onClick={() => setContactStep(false)}
                className="mt-6 flex items-center gap-2 text-body-sm text-foreground-muted hover:text-primary transition-colors mx-auto"
              >
                <ArrowLeft className="h-4 w-4" /> Back to questions
              </button>
            </div>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  const continueDisabled = current.type === 'multi'
    ? !answers[current.id] || (answers[current.id] as string[]).length === 0
    : false;

  return (
    <>
      <Header variant="minimal" />
      <main className="min-h-screen pt-20 bg-background-cream">
        <Container className="py-12">
          <div className="mx-auto max-w-2xl">
            {/* Header */}
            <div className="mb-10 text-center">
              <p className="overline mb-2 text-gold">Tenant Needs</p>
              <h1 className="font-heading text-display-sm font-bold text-primary">Tell us what you&apos;re looking for</h1>
              <p className="mt-2 text-body text-foreground-muted">
                Step {step + 1} of {STEPS.length}
              </p>
            </div>

            {/* Progress */}
            <div className="mb-10 h-2 w-full rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-gold transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Question */}
            <div className="bg-white rounded-2xl shadow-card p-8">
              <h2 className="mb-2 font-heading text-heading-xl font-bold text-primary text-center">
                {current.question}
              </h2>
              {current.helper && (
                <p className="mb-8 text-center text-body-sm text-foreground-muted">{current.helper}</p>
              )}

              {(current.type === 'choice' || current.type === 'multi') && current.options && (
                <div className={`grid gap-3 ${current.options.length > 4 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
                  {current.options.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setValue(opt.value)}
                        className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all hover:border-gold hover:bg-gold/5 ${
                          isSelected(opt.value)
                            ? 'border-gold bg-gold/10 text-primary'
                            : 'border-border text-foreground-muted'
                        }`}
                      >
                        {Icon && (
                          <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isSelected(opt.value) ? 'bg-gold text-primary' : 'bg-gold/10 text-gold'}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                        )}
                        <span className="flex-1">
                          <span className="block text-body-sm font-semibold text-primary">{opt.label}</span>
                          {opt.description && (
                            <span className="block mt-0.5 text-caption text-foreground-muted">{opt.description}</span>
                          )}
                        </span>
                        {isSelected(opt.value) && <CheckCircle className="h-5 w-5 shrink-0 text-gold" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {current.type === 'text' && (
                <div>
                  <textarea
                    value={(answers[current.id] as string) ?? ''}
                    onChange={e => setAnswers(a => ({ ...a, [current.id]: e.target.value }))}
                    placeholder={current.placeholder}
                    rows={4}
                    className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
              )}

              {(current.type === 'multi' || current.type === 'text') && (
                <div className="mt-6 text-center">
                  <Button
                    size="lg"
                    onClick={advance}
                    disabled={continueDisabled}
                  >
                    {step === STEPS.length - 1 ? 'Continue to contact' : 'Continue'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  {current.type === 'text' && (
                    <button
                      type="button"
                      onClick={advance}
                      className="ml-4 text-body-sm text-foreground-muted hover:text-primary transition-colors"
                    >
                      Skip
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Nav */}
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="mt-6 flex items-center gap-2 text-body-sm text-foreground-muted hover:text-primary transition-colors mx-auto"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
