'use client';

/**
 * Global error boundary for the public site. Catches uncaught errors
 * from any route segment that doesn't have its own error.tsx (the
 * billing surface has its own). Without this, a render-time throw
 * blanks the page for the visitor — terrible first impression.
 *
 * Kept intentionally short, branded, and recovery-focused:
 *   - Branded fallback that matches site styling.
 *   - "Try again" → calls Next.js reset() to re-render the segment.
 *   - "Back home" → escape hatch to /.
 *   - Error logged server-side via console.error (Vercel captures).
 *
 * Honest scope: no 3rd-party error reporting yet. When/if we wire
 * Sentry or similar, hook it here AND in /billing/error.tsx.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app/error]', error.message, { digest: error.digest, stack: error.stack });
  }, [error]);

  return (
    <main className="min-h-screen bg-background-cream flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="font-heading text-heading-md font-bold text-primary mb-2">
          Something went wrong
        </h1>
        <p className="text-body-sm text-foreground-muted mb-6 leading-relaxed">
          We hit an unexpected error loading this page. The issue has been logged. Try again — most pages recover on a second load.
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
            href="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-5 py-2.5 text-body-sm text-foreground-muted hover:text-primary hover:border-primary"
          >
            <Home className="h-4 w-4" /> Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
