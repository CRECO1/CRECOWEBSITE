/**
 * Shared Suspense fallback for billing list / detail pages.
 *
 * Every list page that uses `usePostSaveBust` (which reads
 * useSearchParams under the hood) has to sit inside a Suspense boundary
 * so Next.js's prerender pass doesn't bail. The fallback they all use
 * is identical: full-height cream background, centered gold spinner.
 *
 * Lives as a standalone client component because the importing pages
 * are themselves "use client" — using a Server Component fallback
 * would force RSC boundary semantics we don't need.
 */
'use client';

import { Loader2 } from 'lucide-react';

export function BillingFallback() {
  return (
    <main className="min-h-screen bg-background-cream flex items-center justify-center text-foreground-muted">
      <Loader2 className="h-6 w-6 animate-spin text-gold" />
    </main>
  );
}
