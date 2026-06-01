'use client';

/**
 * Error boundary for every /billing/* route segment.
 *
 * Next.js convention: error.tsx catches uncaught errors thrown from
 * the route's page or any nested client component. Without it, a stray
 * Supabase throw or a render-time exception (e.g. broken date in a
 * recurring template) blanks the page entirely — no recovery UI,
 * operator has to refresh blind.
 *
 * What this gives:
 *   1. A branded fallback that fits the billing surface (matches the
 *      BillingFallback aesthetic).
 *   2. A "Try again" button that calls Next.js's reset() to re-render
 *      the segment — useful when the failure was transient (network
 *      hiccup, expired auth).
 *   3. A "Back to billing dashboard" link as a last-resort escape.
 *   4. Server-side error logging via console.error — Vercel's function
 *      logs preserve the stack so we can debug after the fact.
 *
 * Honest scope: this does NOT report errors to a third-party tool
 * (Sentry, etc.). When/if we wire one up, hook it here.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function BillingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the server-side console so Vercel captures the stack.
    // The digest is Next.js's per-error fingerprint for cross-referencing.
    console.error('[billing/error]', error.message, { digest: error.digest, stack: error.stack });
  }, [error]);

  return (
    <main className="min-h-screen bg-background-cream flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="font-heading text-heading-md font-bold text-primary mb-2">
          Something went wrong on this page
        </h1>
        <p className="text-body-sm text-foreground-muted mb-6 leading-relaxed">
          We hit an unexpected error loading this billing page. The error has been logged.
          Try again — most issues clear on a second load. If it keeps happening, head back to the dashboard.
        </p>
        {error.digest && (
          <p className="text-caption text-foreground-subtle font-mono mb-6">
            Reference: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
          <Link
            href="/billing"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-5 py-2.5 text-body-sm text-foreground-muted hover:text-primary hover:border-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
