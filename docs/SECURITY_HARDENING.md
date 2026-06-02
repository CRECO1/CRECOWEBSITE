# Security Hardening Notes — Operator Checklist

This document covers the **Supabase project-level** hardening items that
can't be enforced from application code. Audited and shipped from-code
items are tracked in commit history (see `qa+security:` and
`security:` commits).

## Status of code-level hardening (already shipped)

- HTTP security headers (`next.config.js`): CSP, HSTS preload (2yr),
  X-Frame-Options, X-Content-Type-Options, X-XSS-Protection,
  Referrer-Policy (strict-origin-when-cross-origin), Permissions-Policy
  (every unused browser API disabled).
- All 37 API routes auth-gated (`requireAdmin` / cron secret / webhook signature).
- Row-level security on every billing table via `is_billing_admin()` (migration 0029).
- Storage buckets (`tax-documents`, `receipts`) admin-gated, signed URLs only.
- Per-IP rate limiter on public endpoints (inquiry, leads, tour-request, subscribe).
- W-9 magic-byte validation, error message sanitization, CSV formula injection blocked.
- Open redirect blocked via `safeRedirect` allowlist.
- Webhook replay protection: Stripe signature + idempotent invoice status check,
  Resend Svix signature + 5-minute timestamp window + unique-event-id index.
- Error boundaries (`/app/error.tsx`, `/app/billing/error.tsx`).
- Next.js patched to 15.5.19 (covers HIGH-severity middleware bypass + SSRF + DoS CVEs).

## Operator-side hardening (verify in Supabase dashboard)

These are settings in https://supabase.com/dashboard/project/lzynidkwnvwdpyluiqhg.
Each is a real hardening lever that the code cannot enforce.

### 1. Email signup must be disabled

**Why:** Every billing-table RLS policy ultimately gates on
`is_billing_admin()` — which checks the JWT email against `admin_users`.
If a stranger can sign up via `supabase.auth.signUp()`, they get a JWT
but not an `admin_users` row, so the RLS still denies them. Defense in
depth. But — better to deny the JWT creation upstream.

**How to verify:**
1. **Authentication → Sign In / Up → Email**
2. Confirm **"Allow new users to sign up"** is **OFF**
3. Admin accounts are created manually via Supabase Studio or via
   `supabase.auth.admin.createUser()` (the `createAdminUser` helper in
   `src/lib/auth.ts`).

### 2. Auth providers — email-only

**Why:** This is an internal admin tool with a known admin list. Social
providers (Google/GitHub) expand the attack surface (account-takeover
risk on third-party accounts).

**How to verify:**
1. **Authentication → Sign In / Up → Providers**
2. Only **Email** should be enabled
3. Disable Google, GitHub, Apple, etc. if they're toggled on

### 3. MFA / TOTP for admin accounts

**Why:** Even with a strong password, credential stuffing or phishing
can compromise an admin account. TOTP is the lowest-friction second
factor available.

**How to verify:**
1. **Authentication → Multi-Factor Authentication**
2. Enable **TOTP** as an MFA method
3. Have every admin (currently just `zack@crecotx.com`) enroll their
   authenticator (1Password, Authy, etc.) via the auth UI
4. Once everyone's enrolled, consider enabling
   **"Force MFA for all users"** to require TOTP at every sign-in

### 4. Database backups — daily, tested

**Why:** Most data-loss events are accidental (a bad DELETE) not
malicious. Daily backups + a tested restore process turn a fire-drill
into a routine.

**How to verify:**
1. **Database → Backups**
2. Confirm **Daily backup** is enabled (Pro tier and above)
3. At least once a quarter, do a **point-in-time restore** to a
   branch and verify the data looks right. Document what works.

### 5. JWT secret rotation

**Why:** A leaked JWT secret lets an attacker mint arbitrary admin
tokens. Quarterly rotation limits the window if a secret is ever
exposed (Vercel env logs, accidental commit, etc.).

**How to verify:**
1. **Authentication → JWT Settings → JWT Secret**
2. Rotate every 6 months — calendar a quarterly reminder
3. After rotation, redeploy Vercel so the new secret propagates

### 6. Network restrictions (IP allowlist) — if you ever lock it down

**Why:** Limits the DB connection surface to Vercel + your office IP.
Reduces blast radius if `DATABASE_URL` ever leaks.

**How to verify:**
1. **Database → Network Restrictions** (Pro tier and above)
2. **NOT recommended for current setup** — Vercel uses ephemeral IPs
   that change. Locking the DB to a CIDR would break production.
3. If you ever move off Vercel to a fixed-IP environment, revisit.

### 7. Email rate limits (Auth)

**Why:** Supabase Auth has its own rate limits on `signInWithPassword`,
`signUp`, `resetPasswordForEmail` etc. These are tighter than what we
can do in application code.

**How to verify:**
1. **Authentication → Rate Limits**
2. Confirm signin attempts are limited (default is generous; consider
   tightening "Email sign-in" to ~10/hour if you're getting brute-force
   attempts in the logs)

### 8. Vercel deployment protection (preview deployments)

**Why:** Preview deploys (each PR / branch) get public URLs. If a
preview ever bundles real data or test credentials, anyone with the
URL has access.

**How to verify:**
1. https://vercel.com/dashboard → CRECO project → Settings → Deployment Protection
2. Enable **Vercel Authentication** for preview deployments (only
   Vercel team members can view)
3. Production stays publicly accessible — only previews are gated

## Quarterly audit cadence

Calendar these for review every 3 months:

- [ ] Run `npm audit --omit=dev` — patch HIGH/CRITICAL
- [ ] Review `admin_users` table contents — remove ex-employees
- [ ] Run a point-in-time DB restore to verify backups work
- [ ] Spot-check Vercel function logs for unexpected error spikes
- [ ] Re-run `scripts/probe-billing-db.mjs` to verify RLS policies are still pinned to `is_billing_admin()`
- [ ] Review `supabase/migrations/` for any new tables added without explicit RLS policies

## Known accepted trade-offs

These are findings from past audits that we've consciously decided NOT to fix:

- **`fast-uri@3.1.0` HIGH CVE** (path traversal). Buried in
  `payload → ajv → fast-uri`. Payload CMS doesn't publish a build using
  the patched fast-uri yet. Effective exploitability is low (the
  affected code path is internal to Payload's admin route handling).
  Re-evaluate when Payload publishes a build with patched ajv.

- **Payload peer-dep mismatch with Next 15.5.x.** Payload pins
  `next@>=15.4.11 <15.5.0` (and `>=16.2.6`). We're on 15.5.19 for the
  middleware-bypass + SSRF CVE patches. Payload still works at
  runtime; the peer-dep is a soft warning. Re-evaluate when Payload
  publishes 15.5 support.

- **No CI test suite.** Manual smoke testing on every push. Adding a
  Vitest suite for API routes is worthwhile but out of scope until
  the project stabilizes.
