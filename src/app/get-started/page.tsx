'use client';

import { useState } from 'react';
import {
  ArrowRight, ArrowLeft, CheckCircle, Building2, Briefcase, Warehouse, Store, Layers,
  MapPin, ShoppingBag, LineChart, Wrench, Compass,
} from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { getRecaptchaToken } from '@/components/forms/Recaptcha';
import { Honeypot } from '@/components/forms/Honeypot';

/**
 * Multi-path inquiry quiz — replaces the old /tenant-needs single-path form.
 *
 * Step 0: visitor picks one of 5 paths (tenant / buyer / seller / pm / exploring).
 * Steps 1-N: path-specific questions defined as data below.
 * Final step: contact info, then POST to /api/inquiry with `path` + answers.
 *
 * Every step's UI uses the same renderer; each path just supplies its own
 * STEPS array. New paths or question changes can be added by editing the
 * PATHS map below — no JSX changes required.
 */

type Path = 'tenant' | 'buyer' | 'seller' | 'pm' | 'exploring';

interface QuizStep {
  id: string;
  question: string;
  helper?: string;
  type: 'choice' | 'multi' | 'text';
  placeholder?: string;
  options?: { label: string; value: string; icon?: any; description?: string }[];
}

interface PathConfig {
  label: string;
  description: string;
  icon: any;
  steps: QuizStep[];
  ctaCopy: string;
  successCopy: string;
}

const PATHS: Record<Path, PathConfig> = {
  // ─── TENANT (existing flow, slightly polished) ─────────────────────────
  tenant: {
    label: "I'm looking for space",
    description: 'Lease office, warehouse, retail, flex, or land',
    icon: Building2,
    ctaCopy: 'Send My Requirements',
    successCopy: 'A CRECO broker will email you 3-5 vetted properties that match your size, budget, and submarket within one business day.',
    steps: [
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
          { label: 'Either — show me both', value: 'both', description: 'Lease and sale opportunities' },
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
        question: "What's your monthly budget?",
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
        helper: 'Submarket name (e.g. Northwest, Downtown) or specific zip codes — comma separated. Leave blank if open.',
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
    ],
  },

  // ─── BUYER (new) ───────────────────────────────────────────────────────
  buyer: {
    label: "I'm looking to buy",
    description: 'Acquire commercial property — single asset, portfolio, or 1031 exchange',
    icon: ShoppingBag,
    ctaCopy: 'Send My Acquisition Profile',
    successCopy: 'A CRECO investment principal will reach out within one business day with deal flow that matches your thesis — including off-market opportunities our network sees first.',
    steps: [
      {
        id: 'acquisition_type',
        question: 'What type of acquisition are you considering?',
        type: 'choice',
        options: [
          { label: 'Single asset — investment', value: 'single-asset', description: 'Buy one stabilized or value-add property' },
          { label: 'Single asset — owner-user', value: 'owner-user', description: 'Buy a building for your own business to occupy' },
          { label: 'Portfolio acquisition', value: 'portfolio', description: 'Multiple assets in one transaction' },
          { label: 'Value-add / repositioning', value: 'value-add', description: 'Distressed or under-managed assets to improve' },
          { label: 'Just exploring', value: 'exploring', description: "Not sure yet, want to see what's available" },
        ],
      },
      {
        id: 'property_types',
        question: 'What property types interest you?',
        helper: 'Select all that apply.',
        type: 'multi',
        options: [
          { label: 'Office', value: 'office', icon: Briefcase },
          { label: 'Retail', value: 'retail', icon: Store },
          { label: 'Industrial / Warehouse', value: 'industrial', icon: Warehouse },
          { label: 'Flex', value: 'flex', icon: Layers },
          { label: 'Multifamily', value: 'multifamily', icon: Building2 },
          { label: 'Mixed-use', value: 'mixed-use', icon: Layers },
          { label: 'Land', value: 'land', icon: MapPin },
          { label: 'Open to all', value: 'any', icon: Compass },
        ],
      },
      {
        id: 'budget',
        question: "What's your investment budget?",
        helper: 'Approximate purchase price (not equity check).',
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
      {
        id: 'exchange_1031',
        question: 'Is this a 1031 exchange?',
        helper: '1031 buyers have hard 45-day identification windows — we move fast.',
        type: 'choice',
        options: [
          { label: 'Yes — actively in 45-day window', value: 'in-window', description: 'Closed on the down-leg, identification deadline approaching' },
          { label: 'Considering — preparing to sell', value: 'planning', description: 'Selling soon, want to line up replacement options' },
          { label: 'No — straight acquisition', value: 'no' },
          { label: 'Not sure / advise me', value: 'unsure' },
        ],
      },
      {
        id: 'submarkets',
        question: 'Preferred Texas submarkets or cities?',
        helper: 'Examples: "San Antonio Northeast industrial," "Austin Domain office," "DFW Frisco retail," or zip codes. Leave blank if open.',
        type: 'text',
        placeholder: 'e.g. San Antonio I-35 corridor, Austin, Houston Galleria',
      },
      {
        id: 'priorities',
        question: 'What matters most in your acquisition?',
        helper: 'Select all that apply.',
        type: 'multi',
        options: [
          { label: 'Cap rate / yield', value: 'cap-rate' },
          { label: 'Value-add upside', value: 'upside' },
          { label: 'Stable cash flow', value: 'stable-cash-flow' },
          { label: 'Tenant credit quality', value: 'credit' },
          { label: 'Location / submarket fundamentals', value: 'location' },
          { label: 'Off-market access', value: 'off-market' },
          { label: 'Distressed / opportunistic', value: 'distressed' },
        ],
      },
      {
        id: 'timeline',
        question: 'What\'s your ideal close timeline?',
        type: 'choice',
        options: [
          { label: 'ASAP (1031 window or under contract)', value: 'asap' },
          { label: '1 – 3 months', value: '1-3-months' },
          { label: '3 – 6 months', value: '3-6-months' },
          { label: '6 – 12 months', value: '6-12-months' },
          { label: 'Just exploring', value: 'exploring' },
        ],
      },
    ],
  },

  // ─── SELLER (new) ──────────────────────────────────────────────────────
  seller: {
    label: 'I want to sell or list a property',
    description: 'Get a Broker Opinion of Value or list your property',
    icon: LineChart,
    ctaCopy: 'Request a Property Opinion',
    successCopy: 'A CRECO principal will tour your property, audit the rent roll and operating history, and deliver a written Broker Opinion of Value with recommended marketing strategy within 5-7 business days. No obligation.',
    steps: [
      {
        id: 'property_type',
        question: 'What type of property are you selling?',
        type: 'choice',
        options: [
          { label: 'Office', value: 'office', icon: Briefcase },
          { label: 'Retail', value: 'retail', icon: Store },
          { label: 'Industrial / Warehouse', value: 'industrial', icon: Warehouse },
          { label: 'Flex', value: 'flex', icon: Layers },
          { label: 'Multifamily', value: 'multifamily', icon: Building2 },
          { label: 'Mixed-use', value: 'mixed-use', icon: Layers },
          { label: 'Land', value: 'land', icon: MapPin },
        ],
      },
      {
        id: 'value',
        question: "What's the approximate value of the property?",
        helper: 'Your best estimate — we\'ll provide a formal Broker Opinion of Value.',
        type: 'choice',
        options: [
          { label: 'Under $1M', value: 'under-1m' },
          { label: '$1M – $3M', value: '1-3m' },
          { label: '$3M – $10M', value: '3-10m' },
          { label: '$10M – $30M', value: '10-30m' },
          { label: '$30M+', value: '30m-plus' },
          { label: 'Not sure — need a BOV', value: 'need-bov' },
        ],
      },
      {
        id: 'address',
        question: "What's the property address?",
        helper: 'Street address (or just city + general area if you prefer to keep it confidential at first).',
        type: 'text',
        placeholder: 'e.g. 1234 Industrial Way, San Antonio, TX 78219',
      },
      {
        id: 'goal',
        question: "What's your top priority for the sale?",
        type: 'choice',
        options: [
          { label: 'Highest sale price', value: 'highest-price', description: 'Maximize value, willing to wait for the right buyer' },
          { label: 'Fastest close', value: 'fastest-close', description: 'Speed matters more than top dollar' },
          { label: 'Most certainty', value: 'certainty', description: 'Lowest risk of the deal falling through' },
          { label: 'Lease vs. sell analysis', value: 'analysis', description: 'Want CRECO to advise on the right path' },
        ],
      },
      {
        id: 'occupancy',
        question: "What's the current occupancy?",
        type: 'choice',
        options: [
          { label: 'Vacant', value: 'vacant' },
          { label: 'Partially leased', value: 'partial' },
          { label: 'Fully leased / stabilized', value: 'fully-leased' },
          { label: 'Owner-occupied (your business uses it)', value: 'owner-occupied' },
        ],
      },
      {
        id: 'timeline',
        question: 'When would you like to close?',
        type: 'choice',
        options: [
          { label: 'ASAP (within 60 days)', value: 'asap' },
          { label: '2 – 4 months', value: '2-4-months' },
          { label: '4 – 8 months', value: '4-8-months' },
          { label: '8 – 12 months', value: '8-12-months' },
          { label: 'Just exploring / want a BOV', value: 'exploring' },
        ],
      },
      {
        id: 'notes',
        question: 'Any special considerations?',
        helper: 'Optional. Examples: 1031 exchange motivation, deferred maintenance, off-market preferred, tenant in place we want to keep, etc.',
        type: 'text',
        placeholder: 'e.g. 1031 selling to redeploy into industrial. Confidential — tenants don\'t know yet.',
      },
    ],
  },

  // ─── PROPERTY MANAGEMENT (new) ─────────────────────────────────────────
  pm: {
    label: 'I need property management',
    description: 'Day-to-day operations + strategic asset management',
    icon: Wrench,
    ctaCopy: 'Schedule a Portfolio Review',
    successCopy: 'A CRECO principal will tour your assets, audit existing leases and rent rolls, and deliver a written strategy memo within two weeks. No obligation.',
    steps: [
      {
        id: 'portfolio_size',
        question: 'How many properties are in your portfolio?',
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
        id: 'property_types',
        question: 'What property types are in the portfolio?',
        helper: 'Select all that apply.',
        type: 'multi',
        options: [
          { label: 'Retail', value: 'retail', icon: Store },
          { label: 'Industrial / Warehouse', value: 'industrial', icon: Warehouse },
          { label: 'Office', value: 'office', icon: Briefcase },
          { label: 'Flex', value: 'flex', icon: Layers },
          { label: 'Multifamily', value: 'multifamily', icon: Building2 },
          { label: 'Mixed-use', value: 'mixed-use', icon: Layers },
        ],
      },
      {
        id: 'current_pm',
        question: "Who manages the portfolio today?",
        type: 'choice',
        options: [
          { label: 'I manage it myself', value: 'self' },
          { label: 'Another property management firm', value: 'other-pm', description: "Looking for a better fit" },
          { label: 'No one — currently building / acquiring', value: 'none' },
          { label: 'In-house team but considering outsourcing', value: 'in-house' },
        ],
      },
      {
        id: 'pain_point',
        question: "What's prompting the change?",
        helper: 'Select all that apply.',
        type: 'multi',
        options: [
          { label: 'NOI growth / leasing focus', value: 'noi' },
          { label: 'Better financial reporting', value: 'reporting' },
          { label: 'Cost reduction', value: 'cost' },
          { label: 'Outgrowing current PM', value: 'outgrew' },
          { label: 'Recently acquired new properties', value: 'new-acquisition' },
          { label: 'Tenant retention issues', value: 'retention' },
          { label: 'Capex / strategic guidance needed', value: 'strategy' },
        ],
      },
      {
        id: 'portfolio_value',
        question: "What's the approximate total portfolio value?",
        type: 'choice',
        options: [
          { label: 'Under $5M', value: 'under-5m' },
          { label: '$5M – $15M', value: '5-15m' },
          { label: '$15M – $50M', value: '15-50m' },
          { label: '$50M – $100M', value: '50-100m' },
          { label: '$100M+', value: '100m-plus' },
          { label: 'Prefer not to say', value: 'private' },
        ],
      },
      {
        id: 'service_area',
        question: 'Where are the properties located?',
        helper: 'Select all that apply.',
        type: 'multi',
        options: [
          { label: 'San Antonio', value: 'san-antonio' },
          { label: 'Austin', value: 'austin' },
          { label: 'Houston', value: 'houston' },
          { label: 'DFW', value: 'dfw' },
          { label: 'El Paso / West Texas', value: 'west-tx' },
          { label: 'Other Texas', value: 'other-tx' },
          { label: 'Out of state', value: 'out-of-state' },
        ],
      },
      {
        id: 'notes',
        question: 'Anything else we should know?',
        helper: 'Optional. Examples: lender reporting requirements, ESG tracking, specific tenant complaints, capex backlog, etc.',
        type: 'text',
        placeholder: 'e.g. Family office reporting cadence required. 12-property portfolio mostly retail strip centers, two with anchor turnover this year.',
      },
    ],
  },

  // ─── EXPLORING (lightweight catch-all) ─────────────────────────────────
  exploring: {
    label: 'Just exploring',
    description: 'Not sure yet — want to learn more about CRECO',
    icon: Compass,
    ctaCopy: 'Connect Me With CRECO',
    successCopy: 'A CRECO principal will reach out within one business day to learn more about your situation and recommend an approach.',
    steps: [
      {
        id: 'interest',
        question: "What kind of help do you think you'll need?",
        helper: 'Optional — gives our broker a head start.',
        type: 'text',
        placeholder: 'e.g. "Considering buying my first commercial property" or "Curious about office market trends in Austin"',
      },
    ],
  },
};

const PATH_ORDER: Path[] = ['tenant', 'buyer', 'seller', 'pm', 'exploring'];

type Answers = Record<string, string | string[]>;

export default function GetStartedPage() {
  const [path, setPath] = useState<Path | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [contactStep, setContactStep] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // ─── Path picker (Step 0) ───────────────────────────────────────────────
  if (!path) {
    return (
      <>
        <Header variant="minimal" />
        <main className="min-h-screen pt-20 bg-background-cream">
          <Container className="py-12 sm:py-20">
            <div className="mx-auto max-w-3xl">
              <div className="mb-10 text-center">
                <p className="overline mb-2 text-gold">Get Started</p>
                <h1 className="font-heading text-display-sm sm:text-display font-bold text-primary">
                  How can we help?
                </h1>
                <p className="mt-3 text-body text-foreground-muted">
                  Pick what brings you here today and we&apos;ll ask a few questions to match you with the right CRECO broker.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PATH_ORDER.map(p => {
                  const cfg = PATHS[p];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={p}
                      onClick={() => setPath(p)}
                      className="group rounded-2xl border-2 border-border bg-white p-6 text-left transition-all hover:border-gold hover:shadow-card-hover"
                    >
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10 text-gold group-hover:bg-gold group-hover:text-primary transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="mb-2 font-heading text-heading-sm font-bold text-primary group-hover:text-gold transition-colors">
                        {cfg.label}
                      </h3>
                      <p className="text-body-sm text-foreground-muted">{cfg.description}</p>
                    </button>
                  );
                })}
              </div>
              <p className="mt-8 text-center text-caption text-foreground-muted">
                Or call us directly: <a href="tel:+12108173443" className="font-semibold text-gold-dark hover:text-gold">(210) 817-3443</a>
              </p>
            </div>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  const config = PATHS[path];
  const STEPS = config.steps;
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

  async function handleContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const recaptchaToken = await getRecaptchaToken('submit_get_started');
    const honeypot = (new FormData(e.currentTarget).get('website') as string) ?? '';
    await fetch('/api/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, name, company, email, phone, answers, recaptchaToken, website: honeypot }),
    }).catch(() => {});
    setLoading(false);
    setDone(true);
  }

  // ─── Done state ─────────────────────────────────────────────────────────
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
                We&apos;ve got it
              </h1>
              <p className="mb-8 text-body text-foreground-muted">{config.successCopy}</p>
              <div className="rounded-xl bg-white p-6 shadow-card mb-8 text-left">
                <h3 className="font-heading text-heading font-semibold text-primary mb-4">Your responses</h3>
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
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" asChild>
                  <a href="/listings">Browse Properties</a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="/">Back to Homepage</a>
                </Button>
              </div>
            </div>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  // ─── Contact-info step ──────────────────────────────────────────────────
  if (contactStep) {
    const PathIcon = config.icon;
    return (
      <>
        <Header variant="minimal" />
        <main className="min-h-screen pt-20 bg-background-cream">
          <Container className="py-16">
            <div className="mx-auto max-w-lg">
              <div className="mb-8 text-center">
                <PathIcon className="mx-auto mb-4 h-10 w-10 text-gold" />
                <h2 className="font-heading text-display-sm font-bold text-primary mb-2">
                  Where should we send your matches?
                </h2>
                <p className="text-body text-foreground-muted">
                  A CRECO broker responds within one business day.
                </p>
              </div>
              <form onSubmit={handleContact} className="space-y-4 bg-white rounded-2xl shadow-card p-8">
                <Honeypot />
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
                  {config.ctaCopy}
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

  // ─── Question step ──────────────────────────────────────────────────────
  return (
    <>
      <Header variant="minimal" />
      <main className="min-h-screen pt-20 bg-background-cream">
        <Container className="py-12">
          <div className="mx-auto max-w-2xl">
            <div className="mb-10 text-center">
              <p className="overline mb-2 text-gold">{config.label}</p>
              <h1 className="font-heading text-display-sm font-bold text-primary">Tell us what you&apos;re looking for</h1>
              <p className="mt-2 text-body text-foreground-muted">
                Step {step + 1} of {STEPS.length}
              </p>
            </div>

            {/* Progress */}
            <div className="mb-10 h-2 w-full rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>

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
                          isSelected(opt.value) ? 'border-gold bg-gold/10 text-primary' : 'border-border text-foreground-muted'
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
                <textarea
                  value={(answers[current.id] as string) ?? ''}
                  onChange={e => setAnswers(a => ({ ...a, [current.id]: e.target.value }))}
                  placeholder={current.placeholder}
                  rows={4}
                  className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold"
                />
              )}

              {(current.type === 'multi' || current.type === 'text') && (
                <div className="mt-6 text-center">
                  <Button size="lg" onClick={advance} disabled={continueDisabled}>
                    {step === STEPS.length - 1 ? 'Continue to contact' : 'Continue'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  {current.type === 'text' && (
                    <button type="button" onClick={advance} className="ml-4 text-body-sm text-foreground-muted hover:text-primary transition-colors">
                      Skip
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between">
              {step > 0 ? (
                <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 text-body-sm text-foreground-muted hover:text-primary transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              ) : (
                <button onClick={() => { setPath(null); setStep(0); setAnswers({}); }} className="flex items-center gap-2 text-body-sm text-foreground-muted hover:text-primary transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Change path
                </button>
              )}
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
