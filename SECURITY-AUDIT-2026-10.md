# Security Audit — crecotx.com (CRECOWEBSITE) — 2026-10-23 follow-up

**Scope:** this repo (Next.js 15.5.25 App Router on Vercel, Supabase/Postgres, Plaid, Stripe, Resend, Anthropic, CRM bridge). Static code/config/migration review plus `npm audit` and a git-history secret scan. **No code was changed, nothing deployed, no live requests made.**
**Builds on:** `SECURITY-AUDIT.md` (2026-10-16, untracked, never committed). No `fix/audit-high-1-3` branch exists. Local branches are `security-hardening` (fully merged into `main`), `chore/sharp-0.35` (merged), `crm-unsubscribe-proxy`, `pointe-refocus`, and two `feat/*`. No commit since 10-16 touched security, and no migration after `0054` exists. **All 3 High and all 9 Medium findings from the 10-16 audit are still open.** This report re-verifies them against current code, adds what is new, and re-ranks.
**Not verifiable from the repo:** live Supabase RLS/Auth settings, Vercel env vars, Cloudflare/DNS, Plaid/Stripe/Resend dashboards, migrations 0035-0038 (absent from the repo). Items marked **[verify live]** depend on those.

## Summary

| Severity | Count | Notes |
|---|---|---|
| Critical | 0 confirmed exploitable now | 1 Critical-rated dependency advisory (Next.js image-optimizer RCE) is **mitigated in this repo's lockfile** (see D1), but upgrade anyway |
| High | 4 | D1 (Next upgrade), H1, H2, H3 |
| Medium | 11 | 9 carried over, 2 new |
| Low / Info | 11 | |

**Immediate action (before scheduling anything):** none that is an active breach. Three things are cheap enough to do **today**:
1. `npm i next@15.5.28` (or newer 15.5.x) and redeploy, which fixes the Critical RCE and the High server-action DoS advisories (D1).
2. Run the `pg_policies` query in H2 against the live DB and apply a 10-line migration scoping `invoice_email_messages`, `invoice_views`, `landing_pages`.
3. Confirm in the Vercel dashboard that `INVOICE_VIEW_SECRET`, `CRON_SECRET`, `RECAPTCHA_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `RESEND_WEBHOOK_SECRET` are set in Production (M2/M4 behave dangerously if not).

---

## HIGH

### D1. Next.js 15.5.25 has open advisories incl. a Critical image-optimizer RCE and a Server Action DoS (NEW)
- **Where:** `package.json` (`"next": "^15.5.19"`), installed `node_modules/next` = 15.5.25; `next.config.js` `images.remotePatterns`; `src/app/signup/SignupForm.tsx` (contains `'use server'`, so Server Actions exist).
- **Advisories (all fixed in 15.5.28):**
  - GHSA-2464-fhr4-w9xw: unauthenticated RCE in the Image Optimization API, CVSS v4 9.5, glibc Linux only. Root cause is in the upstream image library (sharp/libvips). The advisory says the fix is Next ≥15.5.28 **or** `sharp` ≥0.35.5.
  - GHSA-p3m5-59mp-jv5r: App Router + Server Actions CPU-exhaustion DoS, CVSS v4 8.2, no workaround besides upgrading. This site has a Server Action, so it applies.
  - GHSA-4jqv-mc3x-m676 / GHSA-mcj8-r9mp-w47p: SSG/ISR cache poisoning (moderate; fixed in 15.5.27).
- **Current exposure:** `package.json` pins `sharp` to exactly `0.35.5`, installed is 0.35.5, with no nested copy, and `serverExternalPackages` includes `sharp`. So the RCE precondition is **mitigated in the lockfile**, assuming the Vercel build resolves the same tree. The DoS is not mitigated. `images.remotePatterns` allows `**.vercel-storage.com`, `**.supabase.co`, `**.supabase.in`, `images.unsplash.com`. Wildcard subdomains on shared hosts mean anyone who can host an image on any Supabase project can have it processed by this optimizer.
- **Fix:** `npm i next@15.5.28` (latest 15.5.x is higher; take it), keep `sharp` pinned ≥0.35.5, redeploy. Narrow `**.supabase.co` to your project host `lzynidkwnvwdpyluiqhg.supabase.co`, and `**.vercel-storage.com` to your Blob store host. Update the stale "patched to 15.5.19" note in `docs/SECURITY_HARDENING.md`.

### H1. Public site holds the CRM database's service-role key (unchanged from 10-16)
- **Where:** `src/lib/crm.ts:212-216`, `src/app/unsubscribe/route.ts:10-15` (falls back to the **main** service-role key if the CRM var is unset), `src/app/api/owner-report/route.ts` (`crmAdminClient`), `src/app/api/cron/tracking-retention/route.ts:28`, `src/app/api/cron/market-report/route.ts:47`.
- **Risk:** `CRM_SUPABASE_SERVICE_ROLE_KEY` bypasses RLS on the whole FairOaks CRM. It lives in the env of an internet-facing app with ~20 runtime npm deps, 3 third-party scripts and many unauthenticated routes. Any code-exec, dependency compromise or env leak here equals full CRM compromise. Public routes (`/unsubscribe`, `/api/owner-report`) use it behind only a bearer-style token, and `owner-report` lets an unauthenticated token holder write notes, tags, phone numbers and tasks into the CRM.
- **Fix:** Replace with a scoped Postgres role / PostgREST JWT with INSERT/narrow UPDATE on only the tables used, or route through the existing signed webhook (`CRM_LEAD_WEBHOOK_SECRET`) and add webhook endpoints on the CRM side. Then rotate the current key. Keep it out of Vercel Preview env.

### H2. Self-signup + leftover `USING (true)` RLS policies (unchanged; still present in `0054`)
- **Where:** `supabase/migrations/0054_invoice_views.sql:39-42` (`invoice_email_messages`, `invoice_views`: `FOR ALL TO authenticated USING (true) WITH CHECK (true)`), `supabase/migrations/0003_landing_pages.sql:57-63` (insert/update/delete for any authenticated user; never re-scoped by 0040/0048). Entry point: `src/app/api/onboard/route.ts:190` (`auth.admin.createUser`, so it works even with email signup disabled in Supabase Auth).
- **Exploit:** Anyone registers via `/api/onboard` (reCAPTCHA is skipped when the token is missing or the secret unset; limiter is per-instance memory), clicks the verification email, signs in with the public publishable key, then calls PostgREST directly: reads/edits/deletes every tenant's invoice-recipient emails, IPs and user agents; forges or erases "invoice viewed" evidence that drives dunning/late fees; rewrites public `landing_pages` copy and links (phishing/defacement on the trusted domain).
- **Fix:** New migration: `drop policy` the three, recreate with `using (public.is_billing_admin())` / `is_workspace_member(workspace_id)`. Decide whether `/signup` + `/api/onboard` should exist on crecotx.com; if not, remove or invite-gate it. Run on the live DB: `select schemaname, tablename, policyname, roles, cmd, qual, with_check from pg_policies where qual='true' or with_check='true';` and clear anything that is not a deliberate public-read. Also verify what migrations 0035-0038 contain. **[verify live]**

### H3. Unauthenticated chat endpoint with a spoofable rate limit (unchanged)
- **Where:** `src/app/api/chat/route.ts:72-73` (leftmost `x-forwarded-for`, client-controlled), `:42-52` (in-memory), `:35` (`MAX_TURNS=30`), `:119` (`MAX_ITERATIONS=6`), `src/lib/chat-tools.ts:237` (`capture_lead` writes `leads` + CRM with service-role key).
- **Exploit:** rotate `X-Forwarded-For` per request, so the 20/min limit never binds. Each request can chain 6 Claude calls over 30 × 4,000-char messages: denial-of-wallet on the Anthropic key, plus prompt-injected junk leads that alert the broker. `/api/leads` already uses the correct `clientIp()` from `lib/rate-limit.ts:60`; chat does not.
- **Fix:** Use `enforceRateLimit()`/`clientIp()`, move to a shared store (Upstash/Vercel KV), add global daily spend cap + reCAPTCHA/BotID to start a session, validate `capture_lead` input with `isValidEmail`/`checkEmailQuality`, set a hard monthly limit in the Anthropic console.

---

## MEDIUM

### M1. State-changing GET links (unchanged)
`src/app/api/tour-confirm/route.ts:85` (consumes token, sets `tour-scheduled`, emails prospect), `src/app/unsubscribe/route.ts:32-43` (unsubscribes + deactivates all enrollments on a bare GET), `src/app/api/subscribe/confirm/route.ts`. Mail scanners/prefetchers trigger them. Fix: interstitial page + POST (RFC 8058 one-click for the header), rate-limit `unsubscribe` and `tour-confirm`.

### M2. Invoice view tokens never expire; HMAC key falls back to the service-role key (unchanged)
`src/lib/invoice-view-token.ts:14` (`INVOICE_VIEW_SECRET || SUPABASE_SERVICE_ROLE_KEY`), claim has no `exp` (`:17-36`); `/api/inv/[token]/pdf` serves the full invoice PDF forever; `/api/inv/[token]/seen/route.ts:43` takes the leftmost XFF as the stored IP (spoofable) and writes an unbounded row per `pdf`/`pay_click` call with no rate limit. `/client/[token]` uses a UUID with no expiry (manual rotation only).
**Forgeability check (as asked): solid.** Tokens are HMAC-SHA256, `timingSafeEqual`, length-capped, and bound to invoice id + recipient, so a token cannot be guessed or retargeted at another invoice without the secret. The risk is the secret fallback and non-expiry, not guessability. Fix: require `INVOICE_VIEW_SECRET` (throw if absent), add `exp`, rate-limit, dedupe `pdf`/`pay_click`, use `x-real-ip`.

### M3. Plaid access tokens stored in plaintext (unchanged)
`src/app/api/plaid/exchange/route.ts:67` writes `bank_accounts.plaid_access_token`; read at `src/lib/plaid-sync.ts:47,82`. Exposed only via the DB (RLS, service-role leak, backups, dashboard). The token is **never** returned to the client or any unauthenticated route (verified: all Plaid routes use `requireWorkspaceAdmin`/`requireAdmin`, responses return only counts). Also `upsert(... onConflict: 'plaid_account_id')` (`:81`) is not workspace-qualified, so a second tenant linking the same account id could re-parent a row; low likelihood. Fix: AES-256-GCM / Supabase Vault encryption at the app layer, and ensure the column is excluded from client-reachable selects.

### M4. Rate limiting is per-instance memory; reCAPTCHA fails open (unchanged)
`src/lib/rate-limit.ts:43`, `src/lib/recaptcha.ts:30,36`. Every limit (leads 8/min, tour-request 6/min, onboard 5/min, owner-report 20/min…) resets per cold start and isn't shared across instances. Fix: Upstash/Vercel KV backing (file says it's a one-file swap) and/or Vercel WAF rate-limit rules.

### M5. Public forms email arbitrary third parties with attacker-chosen text (unchanged)
`src/app/api/leads/route.ts:446-452`, `tour-request/route.ts:330`, `inquiry/route.ts`, `subscribe/route.ts`. Combined with M4 this is a mail-relay/reputation risk for `noreply@crecotx.com`. Strip CR/LF from subjects; use a fixed greeting; cap per-recipient sends.

### M6. CSP allows `'unsafe-inline'` scripts and broad sources (unchanged)
`next.config.js:21-24,31-34,38-45`. No raw-HTML sink with user data exists today (all `dangerouslySetInnerHTML` are JSON-LD via `jsonLd()` or constant strings; verified across 9 sites), so latent. Narrow `www.google.com` to `/recaptcha/`, drop `api.resend.com`, move to nonce + `strict-dynamic`, add report-only first.

### M7. Dependencies: 19 production advisories (2 critical, 8 high, 9 moderate) (UPDATED)
`npm audit --omit=dev` today. Beyond D1: **dompurify ≤3.4.16 is rated Critical** (5 advisories; transitive via Payload, not used by app code); `undici` ≤7.30 (13 advisories, DoS/response-splitting/TLS-option drop, via Payload); `postcss ≤8.5.22` in `next/node_modules` (build-time); `js-yaml`, `source-map-js`, `fast-copy`, `esbuild` (dev only, no fix), `@payloadcms/next` untrusted-redirect (GHSA-w84c-53h3-mc2g). Payload admin/API is **not mounted** (no `(payload)` route group), so these are mostly dead weight, but they expand the supply chain. Fix: remove Payload (`payload`, `@payloadcms/*`, `src/payload.config.ts`, `collections/`, `globals/`, `withPayload`), `npm audit fix`, bump Next (D1), and add `npm audit --omit=dev` + Dependabot to CI.

### M8. Payload secret hard-coded fallback and `push: true` (unchanged)
`src/payload.config.ts:38` (`|| 'default-secret-change-me'`), `:46` (`push: true` against the shared `DATABASE_URL`). Dormant while Payload is unmounted; remove with M7. `PAYLOAD_SECRET` and `DATABASE_URL` (a direct Postgres connection string, strong credential) sit in the env for no runtime benefit; delete them from Vercel after removal.

### M9. Admin gate uses `ILIKE` with the user's email as pattern (unchanged)
`src/middleware.ts:120` and `src/lib/api-auth.ts:96`. `_`/`%` in a self-registered email act as wildcards against `admin_users`; RLS uses exact match so data stays protected, but the UI/API gate can be passed. Combined with H2 (anyone can register) the precondition exists. Fix: `.eq('email', user.email.toLowerCase())` or call `is_billing_admin()`.

### M10. Anonymous direct inserts into `leads` and `subscribers` bypass every server-side defense (NEW)
`supabase/migrations/0001_init.sql:188-189`, `0009_subscribers.sql:66`: `INSERT TO anon, authenticated WITH CHECK (true)`; `0048` explicitly keeps them. The Supabase URL and publishable key are public by design (`NEXT_PUBLIC_*`), so anyone can POST straight to `https://<project>.supabase.co/rest/v1/leads` with arbitrary column values and no reCAPTCHA, honeypot, rate limit or email-quality check, and can set internal columns (status, notes, owner, tour tokens if columns exist). This is the cheapest path to flood the lead table the broker reads, and to plant content that appears in the admin UI. Reads are properly blocked. Fix: since the site writes via the service-role key (`/api/leads` etc.), drop the anon/authenticated INSERT policies (or restrict to a column-whitelisted `WITH CHECK`); keep inserts server-side only. Confirm nothing in client code inserts directly (grep found none outside `chat-tools.ts`, which is server-side).

### M11. Upload validation is client-side only; no server-side bucket limits (NEW)
`src/app/admin/page.tsx:43-62` (MIME/extension allowlist, client-side only; SVG correctly excluded), `src/lib/receipts.ts:33,87-140` (30 MB cap, extension from processed type, UUID path: no path traversal), `src/lib/w9.ts:43,61-123` (5 MB, PDF only, `%PDF` magic-byte check). These checks run in the browser, so a signed-in admin (or a compromised admin session) can upload anything straight to Supabase Storage. Writes to `images` (public bucket, served from your origin's image optimizer) are admin-gated by `0048`; `receipts` was admin-gated by `0043` (the earlier any-authenticated-user policy in `0026` is superseded, so that is not an open hole). The migrations set no `allowed_mime_types` or `file_size_limit` on any bucket. Fix: set bucket-level MIME allowlist (`image/jpeg,png,webp,avif,gif` for `images`; `application/pdf` for `tax-documents`) and size limits in Supabase. Low urgency because only admins can write. **[verify live that 0043 is applied]**

---

## LOW / INFO

1. **`/api/owner-report` unauthenticated CRM writes** (`route.ts:35-130`): token is 16-64 chars of `[A-Za-z0-9_-]`, no expiry; a link holder can inject a phone/interest and trigger a CRM task + broker email. Add expiry and per-report dedupe.
2. **Clarity session replay can capture `/r/` and `/inv/`** (bearer-token pages; `lib/analytics-gate.ts` excludes `/admin /billing /manage /client/` only). Add both prefixes; mask form inputs in Clarity.
3. **Rewrite `/api/campaigns/unsubscribe` → `fairoaksrealtygroup.com`** (`next.config.js:302-309`) forwards request headers incl. cookies to another host; fixed destination, so no SSRF. The site now serves its own `/unsubscribe`, so retire the rewrite or strip `Cookie`.
4. **Crawler logging is a spoofable service-role DB write** (`src/middleware.ts:42-56`): any `Googlebot` UA inserts into `crawler_hits` (unbounded). Sample/rate-limit; wire the retention cron.
5. **`/api/onboard` user enumeration + raw error echo** (`:200-208`: 409 "already exists", returns Supabase error text); generic responses.
6. **Stripe webhook echoes signature-verification error** (`stripe/webhook/route.ts:71`); return generic text.
7. **Cron secret compared with `!==`** in 11 handlers (non-constant-time); share one `timingSafeEqual` helper. Cron routes **fail closed** (503) when `CRON_SECRET` is unset (verified).
8. **`/api/brochure/[slug]` redirects to `listing.brochure_url`** (`route.ts:30`) from the DB. `new URL(x, req.url)` accepts any absolute URL, so a bad value (admin-controlled or via H2/M10-style tampering) is an open redirect off a trusted domain. Validate `https:` + allowlisted host.
9. **Config hygiene:** `.mcp.json` commits the production Supabase `project_ref` MCP URL (not a secret; scope it read-only); `.env.local.bak` (untracked, mode 600) duplicates live secrets on disk, delete it; `.env.local` holds a `VERCEL_OIDC_TOKEN` (short-lived, still don't share the folder); `.env.from-vercel` is empty; `deploy.sh` runs `vercel --prod` from a laptop with no CI; `eslint.ignoreDuringBuilds:true`; `.env.example` omits `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `STRIPE_*`, `ANTHROPIC_API_KEY`, `INVOICE_VIEW_SECRET` (how "fall back to service-role key" defaults happen).
10. **Cookies:** the site sets no first-party session cookie itself; Supabase auth cookies come from `@supabase/ssr` defaults (SameSite=Lax, not HttpOnly because the browser client must read them). The only hand-set cookie (`flagDatacenterVisit`) is non-sensitive. Accept as-is; the practical consequence is that any future XSS can steal the admin session, which is why M6 matters.
11. **Third-party/privacy:** GA, Clarity, reCAPTCHA, first-party tracker to `fairoaksrealtygroup.com`, Anthropic chat; no consent banner and `/privacy` should list Clarity replay and the cross-site beacon.
12. **Info:** `src/app/subscribe/confirmed/page.tsx:57` uses `dangerouslySetInnerHTML` on a constant string (safe today; use JSX). `docs/SECURITY_HARDENING.md` is stale on Next version and "signup is off".

---

## Verified solid (checked this pass)

- **Route authorization:** all 45 `src/app/api` route handlers were enumerated. Each is gated by `requireAdmin`/`requireWorkspaceAdmin` (session **and** `admin_users` allowlist, then workspace), `CRON_SECRET` (fail-closed 503), a verified webhook signature (Stripe `constructEvent`; Resend Svix), a signed HMAC token, or is an intentionally public form/listing endpoint with validation + limiter. No unauthenticated route returns another party's data. `invoices/[id]/remind` is the one admin route using the service-role client, and it filters by `workspace_id`, so no cross-tenant IDOR. Admin-session routes use the session client, so RLS applies. `GET /api/listings` returns only public listing data.
- **Token routes (`/inv/[token]`, `/api/inv/*`, `/client/[token]`, `/r/[token]`):** `/inv` HMAC-signed (unforgeable without the secret; see M2 for expiry). `/client` uses a `gen_random_uuid()` token (122 bits, shape-validated, column allowlist, not `select('*')`). `/api/tour-confirm` demands a ≥32-hex single-use token.
- **Service-role key never reaches the browser:** the only references are in server files (route handlers, server components under `app/inv` and `app/client`, `lib/*` server modules). No `NEXT_PUBLIC_` var holds a secret (the public list is Supabase URL + publishable key, GA/Clarity IDs, reCAPTCHA **site** key, Maps key, flags). Confirm the Maps and reCAPTCHA keys are HTTP-referrer restricted in Google Cloud.
- **RLS:** `ENABLE ROW LEVEL SECURITY` appears for every core table in the migrations (`invoice_counters` is the only one without an explicit enable in the files; check live, it holds only counters). Leads/subscribers/admin_users reads are admin-scoped (`0048`, with a self-verifying DO block); listings/agents/submarkets/testimonials/site_settings writes are admin-scoped (`0040`); `crawler_hits` and its views are revoked from API roles (`0052`); `images` writes admin-gated; `receipts`/`w9` buckets private. Exceptions are in H2 and M10. Receipts were exposed to any authenticated user by `0026` but `0043` closes that.
- **Secrets:** no hardcoded keys/tokens in `src`, `scripts`, `docs`, `supabase`, or any tracked file (pattern scan for JWT, Stripe, Anthropic, Resend, Plaid, Blob, AWS, PEM). Git history across all branches: only `.env.example` was ever added among env-like files; no secret patterns in any diff outside the lockfile. `.gitignore` covers `.env`, `.env.local`, `.env*local`, `.env*`. No secret is logged or returned in a response body (the Plaid and Stripe handlers log only `err.message`). Only default-secret fallback: Payload (M8).
- **Injection:** no raw SQL/`pg` in `src` (`pg` appears only in offline `scripts/apply-*.mjs`, using fixed SQL). PostgREST `.or()` filters interpolate only enum-checked (`txn`) or escaped input (`BillingSearch` escapes `"` and `\`), and that component runs under the admin's own RLS. No `child_process`/`eval`/`new Function`. **SSRF:** no server-side `fetch` of a user-supplied URL (variable-URL fetches are fixed Supabase/Nominatim/CRM endpoints; the two in `admin/page.tsx` run in an admin's browser on their own image URLs).
- **XSS:** every `dangerouslySetInnerHTML` renders `jsonLd()`-escaped JSON-LD or a constant; email HTML escapes all user fields via `escapeHtml`; Payload rich text is not rendered (CMS unmounted).
- **Open redirects:** login `redirect` param is validated (`safeRedirect`); middleware redirects are same-origin constants. Only the brochure case in Low #8.
- **Headers/CORS:** HSTS (2y, preload), `X-Content-Type-Options`, `X-Frame-Options`, `frame-ancestors 'self'`, COOP, strict Permissions-Policy, `Referrer-Policy`, `poweredByHeader:false`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`. No CORS headers are set anywhere, so cross-origin browser reads are denied by default. `X-Robots-Tag: noindex` on all private surfaces and `/api`.
- **Webhooks:** Stripe and Resend verify signatures and are idempotent (unique index from `0048`).
- **Middleware:** fails closed when Supabase env is missing; `/admin` and `/billing` also require the `admin_users` allowlist (modulo M9). No `x-middleware-subrequest` bypass exposure (Next ≥15.2.3).
- **Upload code:** receipt paths are `YYYY/MM/<uuid>.<ext>` (no user-supplied path), extension derived from the processed MIME, SVG rejected for images, W-9 PDF-only with magic-byte check. HEIC conversion (`heic2any`) is client-side only, so it adds no server attack surface.

## Recommended order

1. **Today:** D1 (Next ≥15.5.28 + redeploy); run the `pg_policies` query; confirm prod secrets exist in Vercel.
2. **This week:** one migration closing H2 + M10 (scope `invoice_*`, `landing_pages`, drop anon INSERT on `leads`/`subscribers`); decide on `/api/onboard`; H3 (limiter + spend cap); M2 `INVOICE_VIEW_SECRET` required + `exp`.
3. **Next:** H1 (scoped CRM credential, rotate key); M1 POST-confirm; M3 Plaid token encryption; M4 shared limiter; M9 ILIKE → exact match.
4. **Then:** remove Payload (M7/M8) and delete `PAYLOAD_SECRET`/`DATABASE_URL` from Vercel; nonce CSP (M6); Low items.

## Open questions for Zack

- Is `/signup` meant to be public on crecotx.com? (Decides whether H2 shrinks to a policy cleanup or need the endpoint removed.)
- Are migrations 0035-0038 applied, and what do they contain? Is 0043 (receipts stopgap) live?
- Are `INVOICE_VIEW_SECRET`, `CRON_SECRET`, `RECAPTCHA_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_WEBHOOK_SECRET` set in Vercel **Production**?
- Is image optimization served by Vercel's platform or your function runtime? (Affects how much weight to put on the sharp mitigation in D1; the upgrade makes it moot.)
