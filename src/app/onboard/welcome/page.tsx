import type { Metadata } from 'next';
import { Suspense } from 'react';
import { WelcomeBody } from './WelcomeBody';

/**
 * /onboard/welcome — post-signup landing.
 *
 * Lands here right after /api/onboard succeeds. The page does three jobs:
 *   1. Tells the operator "go check your email and click the verification
 *      link" — this is the most common drop-off point in any SaaS signup.
 *   2. Confirms the workspace exists and tells them its slug (so they
 *      can mentally bookmark it).
 *   3. Shows what's next: sign in → upload W-9 → add first client →
 *      send first invoice. Just enough to anchor the first session.
 *
 * Important: the user is NOT signed in here. They created an auth user
 * but Supabase requires email verification before they can authenticate.
 * The page is therefore intentionally informational + a Sign-in CTA.
 */
export const metadata: Metadata = {
  title: 'Workspace created — verify your email | VultStack',
  robots: 'noindex,nofollow',
};

export default function WelcomePage() {
  return (
    <Suspense>
      <WelcomeBody />
    </Suspense>
  );
}
