'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight, ArrowLeft, CheckCircle, Building2, Briefcase, Warehouse, Store, Layers,
  MapPin, ShoppingBag, LineChart, Wrench, Compass, Star, PhoneCall,
} from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { getRecaptchaToken } from '@/components/forms/Recaptcha';
import { Honeypot } from '@/components/forms/Honeypot';
import { PhoneCallText } from '@/components/marketing/PhoneCallText';
import { trackEvent, leadPayloadFields } from '@/lib/analytics';
import { PRIMARY_BROKER } from '@/lib/broker';
import { GOOGLE_RATING, GOOGLE_REVIEW_COUNT } from '@/lib/reviews';

/**
 * /get-started — the short funnel (v2).
 *
 * v1 asked seven questions per path (29 in all) before anyone could reach the
 * contact step. v2 is capped at THREE questions per path — the three that
 * actually route a lead — then name + best number, done. Everything else
 * (budget, must-haves, occupancy, current manager…) is a conversation for the
 * broker's first call, not a form field.
 *
 * On every screen there is a way out of the quiz: call, text, or "Have us call
 * you" — name + phone, submitted with whatever answers exist so far, so a
 * high-intent visitor never has to finish anything to reach a person.
 *
 * Tracking: every v1 event is kept with the same name, and every event now
 * carries `funnel_version: 'v2'` so the before/after is readable in GA. New:
 * get_started_callback_opened / get_started_callback_submitted.
 *
 * Deep links: /get-started?path=tenant (or buyer/seller/pm/exploring) skips
 * the picker.
 *
 * Questions are data — edit PATHS, not JSX. Keep every path at 3 or fewer.
 */

const FUNNEL_VERSION = 'v2';

type Path = 'tenant' | 'buyer' | 'seller' | 'pm' | 'exploring';

interface QuizStep {
  id: string;
  question: string;
  helper?: string;
  type: 'choice' | 'text';
  placeholder?: string;
  options?: { label: string; value: string; icon?: any; description?: string }[];
}

interface PathConfig {
  label: string;
  description: string;
  icon: any;
  /** At most three. */
  steps: QuizStep[];
  finishHeading: string;
  ctaCopy: string;
  successCopy: string;
}

const PROPERTY_TYPE_OPTIONS = [
  { label: 'Office', value: 'office', icon: Briefcase },
  { label: 'Retail', value: 'retail', icon: Store },
  { label: 'Industrial / Warehouse', value: 'industrial', icon: Warehouse },
  { label: 'Flex', value: 'flex', icon: Layers },
  { label: 'Multifamily', value: 'multifamily', icon: Building2 },
  { label: 'Land', value: 'land', icon: MapPin },
];

const PATHS: Record<Path, PathConfig> = {
  tenant: {
    label: "I'm looking for space",
    description: 'Lease office, warehouse, retail, flex, or land',
    icon: Building2,
    finishHeading: 'Where should we send your options?',
    ctaCopy: 'Send my options',
    successCopy: 'Someone from our team will reach out personally with vetted space that fits — including options that aren’t posted publicly.',
    steps: [
      {
        id: 'space_type',
        question: 'What type of space?',
        type: 'choice',
        options: [
          { label: 'Office', value: 'office', icon: Briefcase },
          { label: 'Warehouse / Industrial', value: 'warehouse', icon: Warehouse },
          { label: 'Flex', value: 'flex', icon: Layers, description: 'Office + warehouse / showroom' },
          { label: 'Retail', value: 'retail', icon: Store },
          { label: 'Land', value: 'land', icon: MapPin },
          { label: 'Not sure yet', value: 'unsure', icon: Compass, description: 'We’ll help you scope it' },
        ],
      },
      {
        id: 'size',
        question: 'Roughly how much space?',
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
    ],
  },

  buyer: {
    label: "I'm looking to buy",
    description: 'Investment property, a building for your business, or a 1031 exchange',
    icon: ShoppingBag,
    finishHeading: 'Who should we call about your search?',
    ctaCopy: 'Send my buyer profile',
    successCopy: 'Someone from our team will reach out personally with opportunities that match — including off-market deals.',
    steps: [
      {
        id: 'purchase_type',
        question: 'What kind of purchase?',
        type: 'choice',
        options: [
          { label: 'Investment property', value: 'investment', description: 'Income-producing or value-add' },
          { label: 'A building for my own business', value: 'owner-user' },
          { label: '1031 exchange — on a deadline', value: '1031', description: 'We move fast on identification windows' },
          { label: 'Just exploring', value: 'exploring' },
        ],
      },
      {
        id: 'property_type',
        question: 'What property type?',
        type: 'choice',
        options: [...PROPERTY_TYPE_OPTIONS, { label: 'Open to all', value: 'any', icon: Compass }],
      },
      {
        id: 'budget',
        question: 'Approximate price range?',
        type: 'choice',
        options: [
          { label: 'Under $1M', value: 'under-1m' },
          { label: '$1M – $3M', value: '1-3m' },
          { label: '$3M – $10M', value: '3-10m' },
          { label: '$10M – $30M', value: '10-30m' },
          { label: '$30M+', value: '30m-plus' },
          { label: 'Not sure yet', value: 'unsure' },
        ],
      },
    ],
  },

  // Internal key stays `seller` so v1 and v2 tracking line up; the door now
  // covers every owner — including the landlord who wants to lease space out,
  // who had no path at all in v1.
  seller: {
    label: 'I own a property',
    description: 'Sell it, lease it out, or find out what it’s worth',
    icon: LineChart,
    finishHeading: 'Who should we call about your property?',
    ctaCopy: 'Send to CRECO',
    successCopy: 'Someone from our team will reach out personally to talk through your property and the right next step. No obligation.',
    steps: [
      {
        id: 'owner_goal',
        question: 'What would you like to do?',
        type: 'choice',
        options: [
          { label: 'Sell it', value: 'sell', icon: LineChart },
          { label: 'Lease it out', value: 'lease', icon: Building2 },
          { label: 'Just want to know what it’s worth', value: 'value', icon: Compass },
        ],
      },
      {
        id: 'property_type',
        question: 'What type of property?',
        type: 'choice',
        options: [...PROPERTY_TYPE_OPTIONS, { label: 'Mixed-use', value: 'mixed-use', icon: Layers }],
      },
      {
        id: 'location',
        question: 'Where is it?',
        helper: 'Street address — or just the city, if you’d rather keep it private for now.',
        type: 'text',
        placeholder: 'e.g. 1234 Industrial Way, San Antonio — or just “Boerne”',
      },
    ],
  },

  pm: {
    label: 'I need property management',
    description: 'Day-to-day operations + strategic asset management',
    icon: Wrench,
    finishHeading: 'Who should we call about your portfolio?',
    ctaCopy: 'Request a portfolio review',
    successCopy: 'Someone from our team will reach out personally to set up a portfolio review. No obligation.',
    steps: [
      {
        id: 'portfolio_size',
        question: 'How many properties?',
        type: 'choice',
        options: [
          { label: '1 property', value: '1' },
          { label: '2 – 5 properties', value: '2-5' },
          { label: '5 – 10 properties', value: '5-10' },
          { label: '10 – 25 properties', value: '10-25' },
          { label: '25+ properties', value: '25-plus' },
        ],
      },
      {
        id: 'property_type',
        question: 'Main property type?',
        type: 'choice',
        options: [
          { label: 'Retail', value: 'retail', icon: Store },
          { label: 'Industrial / Warehouse', value: 'industrial', icon: Warehouse },
          { label: 'Office', value: 'office', icon: Briefcase },
          { label: 'Flex', value: 'flex', icon: Layers },
          { label: 'Multifamily', value: 'multifamily', icon: Building2 },
          { label: 'A mix', value: 'mixed', icon: Compass },
        ],
      },
      {
        id: 'service_area',
        question: 'Where are the properties?',
        type: 'choice',
        options: [
          { label: 'San Antonio', value: 'san-antonio' },
          { label: 'Austin', value: 'austin' },
          { label: 'Houston', value: 'houston' },
          { label: 'Dallas–Fort Worth', value: 'dfw' },
          { label: 'Elsewhere in Texas', value: 'other-tx' },
          { label: 'Several markets', value: 'several' },
        ],
      },
    ],
  },

  exploring: {
    label: 'Just exploring',
    description: 'Not sure yet — want to talk it through',
    icon: Compass,
    finishHeading: 'How can we reach you?',
    ctaCopy: 'Connect me with CRECO',
    successCopy: 'Someone from our team will reach out personally to learn more about your situation and recommend an approach.',
    // No questions: straight to the finish screen, which carries one optional line.
    steps: [],
  },
};

const PATH_ORDER: Path[] = ['tenant', 'buyer', 'seller', 'pm', 'exploring'];

type Answers = Record<string, string>;

/**
 * What the broker reads: labels, not option codes. The notification email,
 * the CRM note and the success screen all show "2,500 – 5,000 SF", never
 * "2500-5000".
 */
function labelAnswers(path: Path | null, answers: Answers): Record<string, string> {
  if (!path) return { ...answers };
  const out: Record<string, string> = {};
  for (const [id, value] of Object.entries(answers)) {
    if (!value) continue;
    const step = PATHS[path].steps.find(s => s.id === id);
    out[id] = step?.options?.find(o => o.value === value)?.label ?? value;
  }
  return out;
}

// ─── Shared pieces ──────────────────────────────────────────────────────────

/** The person who answers — photo, name, and the Google rating. */
function BrokerTrust({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? 'justify-center' : ''}`}>
      {PRIMARY_BROKER.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={PRIMARY_BROKER.photo_url}
          alt={PRIMARY_BROKER.name}
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-gold/40"
        />
      )}
      <div className="text-left">
        <p className="text-body-sm font-semibold text-primary">
          You’ll hear from {PRIMARY_BROKER.name}, {PRIMARY_BROKER.title}
        </p>
        <p className="flex items-center gap-1 text-caption text-foreground-muted">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden="true" />
          {GOOGLE_RATING.toFixed(1)} on Google · {GOOGLE_REVIEW_COUNT} reviews
        </p>
      </div>
    </div>
  );
}

/**
 * "Prefer to talk? Call · Text · Have us call you" — on every screen. The
 * call-me panel submits name + phone with whatever answers exist so far, so a
 * half-finished quiz still arrives as a lead.
 */
function TalkStrip({
  path, answers, stepIndex, allowCallback = true,
}: {
  path: Path | null;
  answers: Answers;
  stepIndex: number;
  allowCallback?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const website = (form.get('website') as string) ?? '';
    const formRenderedAt = Number(form.get('form_rendered_at')) || undefined;
    setSending(true);
    setError(null);
    try {
      const recaptchaToken = await getRecaptchaToken('get_started_callback');
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: path ?? 'exploring',
          callback: true,
          name,
          phone,
          answers: {
            ...labelAnswers(path, answers),
            requested_from_step: path ? `Question ${stepIndex} (${PATHS[path].label})` : 'Choosing a path',
          },
          surface: 'get-started-callback',
          recaptchaToken,
          website,
          form_rendered_at: formRenderedAt,
          ...leadPayloadFields(),
        }),
      });
      if (!res.ok) {
        let msg = `Something went wrong. Please call or text ${PRIMARY_BROKER.phone_display}.`;
        try { const data = await res.json(); if (data?.error) msg = data.error; } catch { /* non-JSON */ }
        trackEvent('get_started_failed', { path: path ?? 'none', reason: `callback_http_${res.status}`, funnel_version: FUNNEL_VERSION });
        setError(msg);
        return;
      }
      trackEvent('get_started_callback_submitted', { path: path ?? 'none', step_index: stepIndex, funnel_version: FUNNEL_VERSION });
      setSent(true);
    } catch {
      trackEvent('get_started_failed', { path: path ?? 'none', reason: 'callback_network', funnel_version: FUNNEL_VERSION });
      setError(`We couldn't reach the server. Please call or text ${PRIMARY_BROKER.phone_display}.`);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-6 rounded-xl border border-gold/40 bg-white p-4 text-center" role="status">
        <p className="text-body-sm font-semibold text-primary">Got it — we’ll call you at {phone} shortly.</p>
        <p className="mt-1 text-caption text-foreground-muted">No need to finish the questions.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 text-center">
      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-body-sm text-foreground-muted">
        <span>Prefer to talk?</span>
        <PhoneCallText variant="inline" surface="get-started" />
        {allowCallback && (
          <>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => {
                if (!open) trackEvent('get_started_callback_opened', { path: path ?? 'none', step_index: stepIndex, funnel_version: FUNNEL_VERSION });
                setOpen(o => !o);
              }}
              aria-expanded={open}
              className="font-semibold text-gold-dark underline-offset-4 hover:text-gold hover:underline"
            >
              Have us call you
            </button>
          </>
        )}
      </p>

      {allowCallback && open && (
        <form onSubmit={submit} className="mx-auto mt-4 max-w-md space-y-3 rounded-xl border border-border bg-white p-5 text-left shadow-card">
          <Honeypot />
          <p className="flex items-center gap-2 text-body-sm font-semibold text-primary">
            <PhoneCall className="h-4 w-4 text-gold-dark" /> We’ll call you — just a name and number.
          </p>
          <input
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold-dark"
          />
          <input
            required
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="Best number to reach you"
            autoComplete="tel"
            className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold-dark"
          />
          <Button type="submit" size="lg" fullWidth loading={sending}>
            Call me
          </Button>
          {error && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-caption text-destructive">{error}</p>
          )}
        </form>
      )}
    </div>
  );
}


function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header variant="minimal" />
      <main className="min-h-screen pt-20 bg-background-cream">{children}</main>
      <Footer />
    </>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function GetStartedPage() {
  const [path, setPath] = useState<Path | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [contactStep, setContactStep] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  function selectPath(p: Path, via: 'picker' | 'deeplink') {
    trackEvent('get_started_path_selected', {
      path: p,
      total_steps: PATHS[p].steps.length,
      via,
      funnel_version: FUNNEL_VERSION,
    });
    setPath(p);
    setStep(0);
    if (PATHS[p].steps.length === 0) {
      trackEvent('get_started_contact_reached', { path: p, total_steps: 0, funnel_version: FUNNEL_VERSION });
      setContactStep(true);
    }
  }

  // /get-started?path=tenant — skip the picker. Read once on mount from the
  // URL directly (useSearchParams would force a Suspense boundary on a page
  // that is otherwise static).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('path');
    if (p && (PATH_ORDER as string[]).includes(p)) selectPath(p as Path, 'deeplink');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One event per question actually seen — which question loses people.
  // Must stay above the conditional returns below (hook order).
  useEffect(() => {
    if (!path || contactStep || done) return;
    const steps = PATHS[path].steps;
    const current = steps[step];
    if (!current) return;
    trackEvent('get_started_step_viewed', {
      path,
      step_id: current.id,
      step_index: step + 1,
      total_steps: steps.length,
      funnel_version: FUNNEL_VERSION,
    });
  }, [path, step, contactStep, done]);

  // ─── Path picker ──────────────────────────────────────────────────────────
  if (!path) {
    return (
      <Shell>
        <Container className="py-12 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <div className="mb-10 text-center">
              <p className="overline mb-2 text-gold">Get Started</p>
              <h1 className="font-heading text-display-sm sm:text-display font-bold text-primary">
                How can we help?
              </h1>
              <p className="mt-3 text-body text-foreground-muted">
                Three quick questions, then our team takes it from there.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {PATH_ORDER.map(p => {
                const cfg = PATHS[p];
                const Icon = cfg.icon;
                return (
                  <button
                    key={p}
                    onClick={() => selectPath(p, 'picker')}
                    className="group rounded-2xl border-2 border-border bg-white p-6 text-left transition-all hover:border-gold hover:shadow-card-hover"
                  >
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10 text-gold transition-colors group-hover:bg-gold group-hover:text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    {/* h2: first content under the page h1. */}
                    <h2 className="mb-2 font-heading text-heading-sm font-bold text-primary transition-colors group-hover:text-gold">
                      {cfg.label}
                    </h2>
                    <p className="text-body-sm text-foreground-muted">{cfg.description}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-10">
              <BrokerTrust compact />
            </div>
            <TalkStrip path={null} answers={{}} stepIndex={0} />
          </div>
        </Container>
      </Shell>
    );
  }

  const config = PATHS[path];
  const STEPS = config.steps;
  const current = STEPS[step];
  const labelled = labelAnswers(path, answers);

  function advance() {
    if (step < STEPS.length - 1) {
      setTimeout(() => setStep(s => s + 1), 200);
    } else {
      // Finished the questions — the last drop-off point before the submit.
      trackEvent('get_started_contact_reached', { path, total_steps: STEPS.length, funnel_version: FUNNEL_VERSION });
      setTimeout(() => setContactStep(true), 200);
    }
  }

  function choose(value: string) {
    setAnswers(a => ({ ...a, [current.id]: value }));
    advance();
  }

  function restart() {
    trackEvent('get_started_restarted', { path, step_index: step + 1, funnel_version: FUNNEL_VERSION });
    setPath(null);
    setStep(0);
    setAnswers({});
    setContactStep(false);
  }

  async function handleContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Read the honeypot + stamp synchronously — e.currentTarget is only valid
    // during the event dispatch.
    const capturedForm = new FormData(e.currentTarget);
    const honeypot = (capturedForm.get('website') as string) ?? '';
    const formRenderedAt = Number(capturedForm.get('form_rendered_at')) || undefined;
    setLoading(true);
    setSubmitError(null);
    try {
      const recaptchaToken = await getRecaptchaToken('submit_get_started');
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path, name, phone,
          email: email.trim() || undefined,
          answers: labelled,
          surface: 'get-started',
          recaptchaToken, website: honeypot, form_rendered_at: formRenderedAt,
          ...leadPayloadFields(),
        }),
      });
      // Only show success if the lead actually landed.
      if (!res.ok) {
        let msg = `Something went wrong sending your request. Please try again, or call ${PRIMARY_BROKER.phone_display}.`;
        try { const data = await res.json(); if (data?.error) msg = data.error; } catch { /* non-JSON error body */ }
        trackEvent('get_started_failed', { path, reason: `http_${res.status}`, funnel_version: FUNNEL_VERSION });
        setSubmitError(msg);
        return;
      }
      // The site's primary conversion — mark as a Key Event in GA4.
      trackEvent('get_started_submitted', { path, email_provided: email.trim().length > 0, funnel_version: FUNNEL_VERSION });
      setDone(true);
    } catch {
      trackEvent('get_started_failed', { path, reason: 'network', funnel_version: FUNNEL_VERSION });
      setSubmitError(`We couldn't reach the server. Check your connection and try again, or call ${PRIMARY_BROKER.phone_display}.`);
    } finally {
      setLoading(false);
    }
  }

  // ─── Done ─────────────────────────────────────────────────────────────────
  if (done) {
    const rows = Object.entries(labelled).filter(([, v]) => v);
    return (
      <Shell>
        <Container className="py-20">
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h1 className="mb-4 font-heading text-display-sm font-bold text-primary">We&apos;ve got it</h1>
            <p className="mb-8 text-body text-foreground-muted">{config.successCopy}</p>
            {rows.length > 0 && (
              <div className="mb-8 rounded-xl bg-white p-6 text-left shadow-card">
                <h2 className="mb-4 font-heading text-heading font-semibold text-primary">What you told us</h2>
                <ul className="space-y-2">
                  {rows.map(([id, val]) => {
                    const q = STEPS.find(s => s.id === id)?.question.replace('?', '') ?? (id === 'interest' ? 'What’s on your mind' : id);
                    return (
                      <li key={id} className="flex items-start gap-2 text-body-sm">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                        <span className="text-foreground-muted">{q}: <strong className="text-primary">{val}</strong></span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/listings">Browse Properties</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/">Back to Homepage</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Shell>
    );
  }

  // ─── Finish: name + best number ───────────────────────────────────────────
  if (contactStep) {
    const PathIcon = config.icon;
    const field = 'w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold-dark';
    return (
      <Shell>
        <Container className="py-12 sm:py-16">
          <div className="mx-auto max-w-lg">
            <div className="mb-6 text-center">
              <PathIcon className="mx-auto mb-4 h-10 w-10 text-gold" />
              <h1 className="mb-2 font-heading text-display-sm font-bold text-primary">{config.finishHeading}</h1>
            </div>
            <div className="mb-6 rounded-xl bg-white/70 px-4 py-3">
              <BrokerTrust compact />
            </div>
            <form onSubmit={handleContact} className="space-y-4 rounded-2xl bg-white p-6 shadow-card sm:p-8">
              <Honeypot />
              <div>
                <label htmlFor="gs-name" className="label-readable">Your name *</label>
                <input id="gs-name" required value={name} onChange={e => setName(e.target.value)} placeholder="First & last name" autoComplete="name" className={field} />
              </div>
              <div>
                <label htmlFor="gs-phone" className="label-readable">Best number to reach you *</label>
                <input id="gs-phone" required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(210) 555-0000" autoComplete="tel" className={field} />
              </div>
              <div>
                <label htmlFor="gs-email" className="label-readable">
                  Email <span className="font-normal text-foreground-muted">(optional)</span>
                </label>
                <input id="gs-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" className={field} />
              </div>
              {path === 'exploring' && (
                <div>
                  <label htmlFor="gs-interest" className="label-readable">
                    What’s on your mind? <span className="font-normal text-foreground-muted">(optional)</span>
                  </label>
                  <input
                    id="gs-interest"
                    value={answers.interest ?? ''}
                    onChange={e => setAnswers(a => ({ ...a, interest: e.target.value }))}
                    placeholder="e.g. Thinking about buying my first commercial building"
                    className={field}
                  />
                </div>
              )}
              <p className="text-caption text-foreground-muted">
                By submitting, you agree to be contacted by CRECO. We never share your information.
              </p>
              <Button type="submit" size="lg" fullWidth loading={loading}>
                {config.ctaCopy}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              {submitError && (
                <p role="alert" aria-live="assertive" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-body-sm text-destructive">
                  {submitError}
                </p>
              )}
            </form>
            {/* Already giving a name + number here, so no call-me panel —
                just the direct lines. */}
            <TalkStrip path={path} answers={answers} stepIndex={STEPS.length + 1} allowCallback={false} />
            <button
              type="button"
              onClick={() => (STEPS.length > 0 ? setContactStep(false) : restart())}
              className="mx-auto mt-6 flex items-center gap-2 text-body-sm text-foreground-muted transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> {STEPS.length > 0 ? 'Back to questions' : 'Change path'}
            </button>
          </div>
        </Container>
      </Shell>
    );
  }

  // ─── Question ─────────────────────────────────────────────────────────────
  const progress = ((step + 1) / (STEPS.length + 1)) * 100;
  return (
    <Shell>
      <Container className="py-10 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 text-center">
            <p className="overline mb-2 text-gold">{config.label}</p>
            <p className="text-body-sm text-foreground-muted">
              Question {step + 1} of {STEPS.length}
            </p>
          </div>

          <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
            <h1 className="mb-2 text-center font-heading text-heading-xl font-bold text-primary">
              {current.question}
            </h1>
            {current.helper && (
              <p className="mb-6 text-center text-body-sm text-foreground-muted">{current.helper}</p>
            )}
            {!current.helper && <div className="mb-6" />}

            {current.type === 'choice' && current.options && (
              <div className={`grid gap-3 ${current.options.length > 4 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
                {current.options.map(opt => {
                  const Icon = opt.icon;
                  const selected = answers[current.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => choose(opt.value)}
                      className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all hover:border-gold hover:bg-gold/5 ${
                        selected ? 'border-gold bg-gold/10 text-primary' : 'border-border text-foreground-muted'
                      }`}
                    >
                      {Icon && (
                        <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-gold text-primary' : 'bg-gold/10 text-gold'}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                      )}
                      <span className="flex-1">
                        <span className="block text-body-sm font-semibold text-primary">{opt.label}</span>
                        {opt.description && (
                          <span className="mt-0.5 block text-caption text-foreground-muted">{opt.description}</span>
                        )}
                      </span>
                      {selected && <CheckCircle className="h-5 w-5 shrink-0 text-gold" />}
                    </button>
                  );
                })}
              </div>
            )}

            {current.type === 'text' && (
              <>
                <input
                  value={answers[current.id] ?? ''}
                  onChange={e => setAnswers(a => ({ ...a, [current.id]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); advance(); } }}
                  placeholder={current.placeholder}
                  className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold-dark"
                />
                <div className="mt-6 text-center">
                  <Button size="lg" onClick={advance}>
                    {step === STEPS.length - 1 ? 'Continue' : 'Next'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <button type="button" onClick={advance} className="ml-4 text-body-sm text-foreground-muted transition-colors hover:text-primary">
                    Skip
                  </button>
                </div>
              </>
            )}
          </div>

          <TalkStrip path={path} answers={answers} stepIndex={step + 1} />

          <div className="mt-6 flex items-center justify-between">
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 text-body-sm text-foreground-muted transition-colors hover:text-primary">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <button onClick={restart} className="flex items-center gap-2 text-body-sm text-foreground-muted transition-colors hover:text-primary">
                <ArrowLeft className="h-4 w-4" /> Change path
              </button>
            )}
          </div>
        </div>
      </Container>
    </Shell>
  );
}
