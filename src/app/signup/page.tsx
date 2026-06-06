import type { Metadata } from 'next';
import { SignupForm } from './SignupForm';

/**
 * /signup — the public-facing VultStack onboarding form.
 *
 * Three fields, one button. The minimum-friction path from "interested"
 * to "your workspace exists and you have an email in your inbox." Form
 * itself is a client component (handles state + submit), the page just
 * provides metadata + the welcome hero + the layout chrome.
 *
 * Why the SaaS onboarding form lives at crecotx.com/signup today and
 * not vultstack.com/signup: vultstack.com is the marketing site, the
 * billing app is at crecotx.com/billing. When billing moves to a
 * dedicated subdomain (app.vultstack.com or similar), this page moves
 * with it. The URL is portable.
 */
export const metadata: Metadata = {
  title: 'Start your VultStack workspace | $150 / month',
  description:
    "Spin up a VultStack billing workspace for your brokerage in under five minutes. Invoicing, expenses, 1099s, recurring billing, and the W-9 auto-attach you've been hand-rolling — all in one place.",
  // Onboarding pages don't get indexed — we want them to be reachable
  // by direct link but not surfaced in SERPs.
  robots: 'noindex,nofollow',
  alternates: { canonical: 'https://www.crecotx.com/signup' },
};

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-background-cream flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="overline mb-2 text-gold-dark">VultStack · Billing</p>
          <h1 className="font-heading text-display-sm font-bold text-primary mb-3 leading-tight">
            Start your workspace.
          </h1>
          <p className="text-body-sm text-foreground-muted leading-relaxed">
            Five minutes. Invoicing, expenses, 1099s, recurring billing.
            <br />
            14-day free trial — $150/mo flat after.
          </p>
        </div>
        <SignupForm />
        <p className="text-caption text-foreground-muted text-center mt-6">
          Already have a workspace?{' '}
          <a href="/manage/login" className="text-gold-dark hover:text-gold font-semibold">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
