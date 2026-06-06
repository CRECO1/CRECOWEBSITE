'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle2, Upload, Users, FileText, ArrowRight } from 'lucide-react';

/**
 * WelcomeBody — client component (needs useSearchParams).
 *
 * The welcome surface deliberately keeps copy short. The hard truth of
 * SaaS signup conversion: every extra word reduces the number of
 * operators who finish verifying their email and complete the next
 * step. The H1 + sub + verification reminder + "what to expect"
 * checklist + sign-in CTA is the whole page.
 */
export function WelcomeBody() {
  const params = useSearchParams();
  const ws = params.get('ws') ?? '';

  return (
    <main className="min-h-screen bg-background-cream flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="overline mb-2 text-gold-dark">VultStack</p>
          <h1 className="font-heading text-display-sm font-bold text-primary mb-3 leading-tight">
            Workspace created.
          </h1>
          <p className="text-body text-foreground-muted leading-relaxed">
            One step left:{' '}
            <span className="font-semibold text-primary">check your email and click the verification link.</span>{' '}
            Then you can sign in and start.
          </p>
        </div>

        {/* Verification reminder card */}
        <div className="rounded-2xl border border-gold/40 bg-gold/5 p-6 mb-6">
          <div className="flex items-start gap-3 mb-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gold/20 text-gold-dark shrink-0">
              <Mail className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-heading text-body font-bold text-primary">Verify your email</h2>
              <p className="text-caption text-foreground-muted mt-0.5">
                We just sent a link to the address you signed up with.
                It usually arrives within a minute. Check spam if you don&apos;t see it.
              </p>
            </div>
          </div>
        </div>

        {/* What's next */}
        <div className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm mb-6">
          <h2 className="font-heading text-body font-bold text-primary mb-4">
            What&apos;s next after you verify
          </h2>
          <ul className="space-y-4">
            <Step
              icon={<Upload className="h-4 w-4" />}
              title="Upload your W-9"
              body="One time, on /billing/invoices/settings. Auto-attached to every invoice email from then on."
            />
            <Step
              icon={<Users className="h-4 w-4" />}
              title="Add your first client"
              body="Or skip — clients save themselves the first time you invoice them."
            />
            <Step
              icon={<FileText className="h-4 w-4" />}
              title="Send your first invoice"
              body="Five fields. Email goes out with the invoice PDF + W-9 attached."
            />
          </ul>
        </div>

        <div className="text-center">
          <Link
            href="/manage/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-7 py-3 text-body-sm font-semibold text-white hover:bg-primary/90"
          >
            Sign in <ArrowRight className="h-4 w-4" />
          </Link>
          {ws && (
            <p className="text-caption text-foreground-muted mt-4">
              Workspace: <span className="font-mono font-semibold text-primary">{ws}</span>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function Step({
  icon, title, body,
}: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15 text-gold-dark shrink-0 mt-0.5">
        {icon}
      </span>
      <div>
        <h3 className="text-body-sm font-semibold text-primary">{title}</h3>
        <p className="text-caption text-foreground-muted mt-0.5 leading-relaxed">{body}</p>
      </div>
    </li>
  );
}
