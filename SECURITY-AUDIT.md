# Security Audit — crecotx.com (CRECOWEBSITE)

**Date:** 2026-10-16 · **Scope:** this repo (Next.js 15 app on Vercel + Supabase), static code/config review only
**Method:** source and config read-through, `npm audit` / `npm outdated` against the committed lockfile, git-history secret scan. No live requests, scans or probes were made against production, and no exploit code was written.
**Not covered:** the FairOaks CRM app (separate session), live Supabase Auth/RLS state, Vercel dashboard env vars/settings, DNS/Cloudflare, Resend/Stripe/Plaid dashboards. Migrations `0035`–`0038` are absent from `supabase/migrations/`, so the *effective* RLS state cannot be fully derived from the repo; confirm against live `pg_policies`.

> This is a marketing site **plus** a multi-tenant billing/invoicing app (`/billing`, `/api/invoices`, Stripe, Plaid), a public self-service signup (`/signup` → `/api/onboard`), an AI chat endpoint, and a direct write path into the CRM database. The risk is concentrated in those extras, not in the marketing pages.

## Summary

| Severity | Count | Headline |
|---|---|---|
| Critical | 0 | No confirmed critical issue. No secrets in the repo or its git history. |
| High | 3 | CRM service-role key lives in the public site; open self-signup + leftover `USING (true)` RLS policies; unauthenticated chat endpoint with a spoofable rate limit. |
| Medium | 9 | State-changing GET links, non-expiring invoice tokens, plaintext Plaid tokens, `unsafe-inline` CSP, outbound-mail abuse, vulnerable/dead dependencies, and others. |
| Low / Info | 9 | Hardening and hygiene. |

**Positive findings (verified, keep these):** no secrets tracked in git or history (`.env*` ignored; only `.env.example`, values blank); every `/api` route is gated by session+`admin_users`, `CRON_SECRET`, a webhook signature, or a signed/unguessable token (cron routes fail closed when the secret is unset); Stripe and Resend webhooks verify signatures and are idempotent; HTML email bodies escape user input (`escapeHtml`); JSON-LD is escaped via `jsonLd()`; open redirect on login is blocked (`safeRedirect`); the middleware fails closed; HSTS preload, nosniff, frame-ancestors, a strict Permissions-Policy and `poweredByHeader:false` are set; the client portal uses a column allowlist and workspace scoping; the earlier `leads`/`subscribers`/`images` RLS holes were fixed in `0048`.

---

## HIGH

### H1. The public marketing site holds the CRM database's service-role key (blast radius)
- **Where:** `src/lib/crm.ts:212-216` (`adminClient`), `src/app/unsubscribe/route.ts:8-15`, `src/app/api/owner-report/route.ts` (via `crmAdminClient`), `src/lib/crm-lead.ts:12-13` (webhook secret). Documented at `.env.example` ("CRM bridge").
- **Impact:** `CRM_SUPABASE_SERVICE_ROLE_KEY` bypasses RLS on the *entire* FairOaks CRM project: every client record, deal, task and campaign. It sits in the env of an internet-facing app that runs ~20 npm-installable runtime packages, three third-party scripts, a public AI endpoint and many unauthenticated routes. Any code-execution, dependency-compromise or env-leak bug on this site becomes full CRM compromise. The public routes use that key with only token checks in front of it (`/api/owner-report`, `/unsubscribe`), and one of them (`owner-report`) lets an unauthenticated caller write notes, tags, phone numbers and *tasks* into the CRM.
- **Fix:** Stop sending the service-role key to this site. Either (a) route everything through the existing authenticated webhook (`CRM_LEAD_WEBHOOK_SECRET`) and add webhook endpoints on the CRM side for `owner-report` and `unsubscribe`, or (b) create a dedicated Postgres role/PostgREST JWT with `INSERT`/narrow `UPDATE` on only the tables used (`crm_clients`, `email_lead_imports`, `crm_deals`, `crm_owner_reports`, `crm_client_activities`, `crm_tasks`) and no read of unrelated PII. Then rotate the current CRM service-role key. Interim: keep the key out of Vercel *Preview* environments.

### H2. Open self-signup (`/api/onboard`) combined with leftover `authenticated`-wide RLS policies
- **Where:** `src/app/api/onboard/route.ts:190` (service-role `auth.admin.createUser` for any visitor), `supabase/migrations/0054_invoice_views.sql:40,42` and `supabase/migrations/0003_landing_pages.sql:57-63`.
- **Impact:** Anyone who can pass the (fail-open) reCAPTCHA gets a real Supabase account, and after email verification a JWT for the *shared* project. Three policies still grant that JWT access it should not have:
  - `invoice_email_messages` and `invoice_views` (added in `0054`, *after* the `0048` clean-up): `FOR ALL TO authenticated USING (true) WITH CHECK (true)`. Any self-provisioned user can read, edit and delete every tenant's recipient emails, IP addresses and user agents, and forge/erase "invoice viewed" evidence. This is a cross-tenant PII leak and an integrity problem for the dunning/late-fee logic that reads these tables.
  - `landing_pages` (`0003`): insert/update/delete for any `authenticated` user, never re-scoped by `0040`/`0048`. A self-provisioned user can rewrite public landing-page copy and links (defacement / phishing on a trusted domain). Content is rendered as text, not raw HTML, so this is not XSS, but it is still public-site tampering.
  - `docs/SECURITY_HARDENING.md` §1 says "email signup must be OFF", yet `/api/onboard` provisions accounts through the admin API, which bypasses that setting. The doc's reassurance is therefore not accurate.
- **Fix:** (1) New migration scoping `invoice_email_messages`, `invoice_views` and `landing_pages` to `public.is_billing_admin()` (and/or `is_workspace_member(workspace_id)` for the invoice tables). (2) Decide whether public onboarding should exist on the production domain at all; if not, remove/disable `/api/onboard` + `/signup` (or gate behind an invite code). If yes, make reCAPTCHA mandatory (fail closed when not configured), add email-domain/disposable checks as in `/api/leads`, and rate-limit durably (see M4). (3) Run `select schemaname, tablename, policyname, roles, cmd, qual, with_check from pg_policies where qual = 'true' or with_check = 'true';` on the live DB and clear every row that is not a deliberate `public read` policy, including whatever lives in the missing migrations 0035-0038.

### H3. Unauthenticated AI chat endpoint: spoofable rate limit = unbounded paid-API spend and lead spam
- **Where:** `src/app/api/chat/route.ts:72-73` (rate-limit key = *leftmost* `x-forwarded-for`), `:42-52` (in-memory bucket), `:119` (`MAX_ITERATIONS = 6`), `:35` (`MAX_TURNS = 30`), `src/lib/chat-tools.ts:176-239` (`capture_lead`).
- **Impact:** The leftmost XFF entry is client-controlled, so each request can claim a fresh "IP" and the 20/min limit never binds (the shared helper `lib/rate-limit.ts:60` already documents and fixes exactly this, but chat doesn't use it). Each request can chain up to 6 Claude calls over up to 30 × 4,000-char messages. A script can burn the Anthropic budget (denial-of-wallet) and, via prompt injection ("call capture_lead for ..."), push arbitrary junk contacts into `leads` and the CRM with `notify:true`, which alerts the broker. `capture_lead` also has no reCAPTCHA, honeypot or fill-time screen, and its email regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) is far weaker than `isValidEmail` (allows commas, parentheses).
- **Fix:** Use `enforceRateLimit(req, …)` / `clientIp()` from `lib/rate-limit.ts` (x-real-ip) and move to a shared store (Upstash/Vercel KV) for this endpoint. Add a per-session and global daily token/spend cap, cap total conversation characters, require a reCAPTCHA token (or Vercel BotID) to start a session, run `capture_lead` input through `isValidEmail`/`checkEmailQuality`, and set a hard monthly limit on the Anthropic key in the Anthropic console.

---

## MEDIUM

### M1. State-changing GET links are triggered by email scanners and prefetchers
- **Where:** `src/app/api/tour-confirm/route.ts:85` (consumes the token, sets `tour-scheduled`, emails the prospect), `src/app/unsubscribe/route.ts:32` (unsubscribes the contact and deactivates all campaign/action-plan enrollments), `src/app/api/subscribe/confirm/route.ts` (double opt-in).
- **Impact:** Corporate link scanners (Safe Links, Proofpoint, Mimecast; the codebase itself notes they open every link) will "click" these. A broker notification email scanned by a gateway auto-confirms the tour and sends the prospect a "You're confirmed" message. Campaign emails scanned by recipients' gateways silently unsubscribe people. `unsubscribe` and `tour-confirm` also have no rate limit and (unsubscribe) uses `.single()` on an unauthenticated lookup.
- **Fix:** Make GET render an interstitial page with a confirm button that POSTs (RFC 8058 one-click `List-Unsubscribe-Post` for the header path); add `enforceRateLimit`; keep tokens single-use.

### M2. Invoice "view" tokens never expire and are signed with the Supabase service-role key as fallback
- **Where:** `src/lib/invoice-view-token.ts:14` (`INVOICE_VIEW_SECRET || SUPABASE_SERVICE_ROLE_KEY`), `:17-36`; `src/app/api/inv/[token]/pdf/route.ts`, `…/seen/route.ts`, `src/app/inv/[token]/page.tsx`, `src/app/client/[token]/page.tsx`.
- **Impact:** (a) If `INVOICE_VIEW_SECRET` is unset in prod, the HMAC key *is* the service-role key, so any bug that reveals the signing material is a full-DB key leak, and rotating one forces rotating the other. (b) Tokens carry no expiry or revocation, so a forwarded or leaked invoice link works forever and returns the full invoice PDF (client name, address, line items, amounts). (c) `/api/inv/*` has no rate limit, and `seen` writes an unbounded row per `pdf`/`pay_click` call plus the raw (and, via leftmost XFF, spoofable) IP. (d) The `/client/[token]` portal (UUID, no expiry) exposes all of a client's invoices; rotation exists (`rotate-portal-token`) but is manual.
- **Fix:** Require a dedicated `INVOICE_VIEW_SECRET` (throw if absent; never fall back to the service-role key). Add an `exp` claim (e.g. 90 days after the invoice due/paid date) and verify it. Rate-limit both routes, dedupe `pdf`/`pay_click` like `view`, take the IP from `x-real-ip`, and consider hashing/truncating it. Offer auto-rotation of portal tokens when an invoice is paid.

### M3. Plaid access tokens stored in plaintext
- **Where:** `src/app/api/plaid/exchange/route.ts:67` → `bank_accounts.plaid_access_token`; read back at `src/lib/plaid-sync.ts:47,82`.
- **Impact:** A long-lived Plaid `access_token` grants read of balances/transactions for the linked business bank accounts. It is protected only by RLS; a SQL-injection-class bug, a leaked service-role key, a DB backup or a support/dashboard view exposes it in clear.
- **Fix:** Encrypt at the application layer (AES-256-GCM with a key in env/KMS, or Supabase Vault/pgsodium) before insert and decrypt in `plaid-sync`; ensure the column is never selected by client-reachable queries. Also verify the `upsert(onConflict: 'plaid_account_id')` cannot re-parent another workspace's row.

### M4. Rate limiting is per-instance memory; reCAPTCHA is deliberately fail-open
- **Where:** `src/lib/rate-limit.ts:43` (module-level `Map`), `src/lib/recaptcha.ts:30,36,62`.
- **Impact:** On Vercel, buckets reset per cold start and are not shared across concurrent instances, so every limit in the repo (`leads` 8/min, `tour-request` 6/min, `onboard` 5/min, `brochure` 15/min, …) is easy to exceed. reCAPTCHA is skipped when the secret is missing, when the token is missing, or when Google is unreachable. The remaining defences (honeypot, fill-time stamp, gibberish-name filter) are client-assisted and trivial to replay. The practical consequences are form/CRM spam, Resend quota burn, and the mail-relay behavior in M5.
- **Fix:** Back `enforceRateLimit` with Upstash/Vercel KV (the file already says the interface is a one-file swap); consider Vercel BotID/WAF rate-limit rules for `/api/*` POSTs; fail closed (or at least score-down) on a missing token for endpoints that send email or create accounts.

### M5. Public forms send mail to arbitrary third-party addresses with attacker-influenced text
- **Where:** `src/app/api/leads/route.ts:446-452` (confirmation to `email`), `src/app/api/tour-request/route.ts:330`, `src/app/api/inquiry/route.ts`, `src/app/api/subscribe/route.ts` (confirmation links).
- **Impact:** A submitter can make `noreply@crecotx.com` email any address a message that includes their chosen `name` (up to 200 chars, HTML-escaped but free text, so phishing wording is possible). Combined with M4 this lets an attacker harass victims and damage the sending domain's reputation (SPF/DKIM pass, spam complaints). Name/subject values also keep `\r\n` (`clampString` allows them) and flow into email subjects (`leads/route.ts` subject lines); the Resend JSON API is not vulnerable to classic SMTP header injection, but strip CR/LF from subjects defensively.
- **Fix:** Only email the confirmation after email verification (as `subscribe` already does), or cap per-recipient sends (one per address per day, stored server-side); strip CR/LF in subjects; use a fixed greeting ("Thanks for contacting CRECO") instead of echoing the raw name.

### M6. CSP allows `'unsafe-inline'` scripts and broad image/connect sources
- **Where:** `next.config.js:21-24,31-34,38-45`.
- **Impact:** With `script-src 'unsafe-inline'`, the CSP does not mitigate reflected/stored XSS if one is ever introduced. Currently there is no raw-HTML sink with user data (all `dangerouslySetInnerHTML` is JSON-LD via `jsonLd()` or constant copy), so the risk is latent. `img-src https:` permits image-based exfiltration/tracking, and `https://www.google.com` in `script-src` lets any script hosted on that origin (e.g. JSONP endpoints) execute. The allowlist also contains `https://api.resend.com` in `connect-src`, which the browser never calls. No `report-to`/`report-uri`, so violations are invisible.
- **Fix:** Move to nonce-based CSP via middleware (`'nonce-…' 'strict-dynamic'`) and drop `'unsafe-inline'` for scripts; narrow `www.google.com` to `https://www.google.com/recaptcha/` and `https://www.gstatic.com/recaptcha/`; remove `api.resend.com`; add `Content-Security-Policy-Report-Only` + a report endpoint first.

### M7. Dependencies: 22 advisories (13 high), mostly via dead Payload code; Next.js has open advisories
- **Where:** `package.json`, `package-lock.json`; `npm audit --omit=dev` (see table below); `src/payload.config.ts`, `src/collections/*`, `src/globals/SiteSettings.ts` (no `(payload)` route group exists in `src/app`, so the Payload admin/API is **not** mounted).
- **Impact:** `payload`, `@payloadcms/next`, `@payloadcms/db-postgres`, `@payloadcms/storage-vercel-blob`, `@payloadcms/richtext-lexical` account for most findings (`undici` DoS/response-splitting, `js-yaml` DoS, `postcss` XSS/file-read, `braces`/`micromatch`/`chokidar` DoS, `esbuild` dev-server, `dompurify`). They are shipped/installed but unused at runtime, so exploitability is low, yet they enlarge the supply chain for nothing. `next@15.5.25` is flagged for two ISR/SSG cache-poisoning advisories (GHSA-4jqv-mc3x-m676, GHSA-mcj8-r9mp-w47p; fix available in 15.5.x). `docs/SECURITY_HARDENING.md` says Next was patched "to 15.5.19"; it has since moved.
- **Fix:** Delete the Payload packages and `src/payload.config.ts`/`collections`/`globals` + `next.config.js`'s `withPayload`, `serverExternalPackages: ['graphql']`, and the `generate:types` script if the CMS is retired (keep `PAYLOAD_SECRET`/`DATABASE_URL` out of env then). Then `npm audit fix`, bump `next` to the latest 15.5.x, `jspdf` (currently 4.2.1) and `@supabase/*` to current. Add Dependabot/`npm audit --omit=dev` to CI (the hardening doc itself notes there is no CI).

| Package (direct unless noted) | Severity | Issue | Reachable? |
|---|---|---|---|
| next 15.5.25 | moderate | ISR/SSG cache poisoning (2 advisories) | Yes (public app); upgrade |
| payload / @payloadcms/* | high | via undici, sass→chokidar→braces, find-node-modules→micromatch | No (not mounted) |
| undici 7.x (via payload) | high | multiple DoS / response splitting | No |
| js-yaml, source-map-js, postcss(<=8.5.22 in next's nested copy) | high | DoS / XSS in CSS stringify / file read | Build-time mostly |
| @payloadcms/db-postgres → drizzle-kit → esbuild | moderate | dev-server request exposure | Dev only |
| dompurify, fast-copy | low/moderate | | Transitive |
| `legacy-peer-deps=true` in `.npmrc` | n/a | Masks the Payload↔Next peer conflict (documented in the hardening doc) | n/a |

### M8. Payload secret has a hard-coded fallback and `push: true` on a shared database
- **Where:** `src/payload.config.ts:38` (`process.env.PAYLOAD_SECRET || 'default-secret-change-me'`), `:46` (`push: true`).
- **Impact:** If `PAYLOAD_SECRET` is ever unset, Payload signs sessions with a public string. `push: true` lets Drizzle auto-alter/drop tables to match collections at boot against the same Postgres (`DATABASE_URL`) that holds production data. Both are dormant today (the admin isn't mounted) but become live the moment anyone re-adds `(payload)` routes.
- **Fix:** Remove with the Payload code (M7), or at minimum throw if `PAYLOAD_SECRET` is missing and set `push: false` in production.

### M9. Admin gate uses `ILIKE` with the user's email as the pattern
- **Where:** `src/middleware.ts:120` and `src/lib/api-auth.ts:96` (`.ilike('email', user.email)`), versus exact `lower(a.email) = lower(...)` in every RLS policy (`0029`, `0040`, `0048`).
- **Impact:** `_` and `%` are wildcards in `ILIKE`. Because self-signup exists (H2), a user can register an email containing `_`/`%` that matches a *different* admin address (e.g. `zack_s@…` matches `zackxs@…`) on providers/domains the attacker controls. Practical exploitability is low for the current admin address (own-domain, no underscore) and RLS (exact match) would still deny data, but the app-level gate and the DB gate should agree, and the app gate is what shows the admin UI.
- **Fix:** Replace with `.eq('email', user.email.toLowerCase())` (store admin emails lower-cased; there is already a unique index on `lower(email)`) or call the existing `is_billing_admin()` RPC from both places.

---

## LOW / INFO

1. **Unauthenticated writes into CRM from `owner-report`** (`src/app/api/owner-report/route.ts`): token is 16-64 chars of `[A-Za-z0-9_-]` (`lib/owner-report.ts:56`), no expiry; anyone with an owner's report link can inject a phone number onto the CRM contact and trigger an "urgent" call task and broker email. Rate limit is in-memory (M4). Add expiry, require the phone to pass `safePhone` length (≥10 digits), and de-duplicate per report.
2. **`/r/[token]` and `/client/[token]` pages are bearer-token URLs** with no expiry; `Referrer-Policy: strict-origin-when-cross-origin` keeps paths out of third-party Referer, and GA gets a generic `page_location`, but Clarity is only suppressed on `/admin /billing /manage /client/`. `/r/` (owner names, addresses, appraised values) is **not** in `EXCLUDED_PREFIXES` (`lib/analytics-gate.ts`), so session replay may capture it. Add `/r/` and `/inv/` to the exclusion list.
3. **Rewrite proxies `/api/campaigns/unsubscribe` to `fairoaksrealtygroup.com`** (`next.config.js:302-309`) and `connect-src` allows the same host (`:48`). Destination is fixed, so no SSRF, but a Next rewrite forwards request headers (including cookies, e.g. the Supabase auth cookies if an admin clicks one) to the other site. The site also now serves its own `/unsubscribe` route, so check whether the rewrite is still needed; if kept, strip `Cookie`.
4. **Crawler logging is a spoofable DB write** (`src/middleware.ts:42-56`, `lib/crawler-hits.ts`): any request with a `Googlebot`/`GPTBot` UA triggers a service-role insert into `crawler_hits` (unbounded; the retention job is only "documented"). Rate-limit or sample, and wire `tracking-retention` to prune (`docs/crawler-tracker.md`).
5. **`/api/onboard` user enumeration:** returns `409 "An account with this email already exists"` (`:200-208`). Return a generic response and rely on the email. Also runs up to 50 slug lookups per call and echoes raw Supabase error text on failure (`:200`). Return generic messages.
6. **Stripe webhook echoes the verification error** (`stripe/webhook/route.ts:71`) in the 400 body; return a generic message and log the detail.
7. **Cron secret comparison is non-constant-time** (`!==` in 11 cron handlers). Practically unexploitable over the network; use `crypto.timingSafeEqual` via one shared helper (also dedupes the 11 copies).
8. **Config/hygiene:** `.mcp.json` commits a Supabase MCP URL with the production `project_ref` (not a secret, but it ties the repo to the project and enables any contributor's agent to attach to it; scope it read-only or move it out of the repo); `.env.local.bak` (untracked, mode 600) holds a second copy of live secrets on disk and `.env.local` contains a `VERCEL_OIDC_TOKEN`: delete the `.bak`, never share the folder; `deploy.sh` still says "Fair Oaks Realty Group" and runs `vercel --prod` from a laptop (prefer Git-based deploys with protected `main`); `eslint.ignoreDuringBuilds: true` and no CI means nothing blocks a risky merge; `.env.example` omits several production-required secrets (`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `STRIPE_*`, `ANTHROPIC_API_KEY`, `INVOICE_VIEW_SECRET`, `CRM_LEAD_WEBHOOK_SECRET`), which is how "fall back to the service-role key" defaults sneak in.
9. **Third-party scripts / privacy:** Google Analytics, Microsoft Clarity (session replay), reCAPTCHA v3 (Google) and a first-party tracker that sends visitor id, click ids (gclid, fbclid…), journey and environment to `fairoaksrealtygroup.com`. None load with Subresource Integrity (not possible for these dynamic tags) and CSP can't pin them. The tracker honours DNT/GPC (good), but there is no consent banner for GA/Clarity/reCAPTCHA and `app/privacy` should list Clarity replay, the cross-site beacon and the chat vendor (Anthropic). Mask form inputs in Clarity. `robots.txt` lists the private path names (`/admin`, `/billing`, `/r/`); harmless but informative.
10. **Informational:** `subscribe/confirmed/page.tsx:57` uses `dangerouslySetInnerHTML` for a constant string (safe today; replace with JSX entities so a future dynamic value can't become a sink). `brochure/[slug]` redirects to `listing.brochure_url` from the DB (admin-controlled; validate it is `https`/same-origin). `docs/SECURITY_HARDENING.md` is stale ("all 37 API routes", "Next patched to 15.5.19", signup-off assumption); update it after the fixes above.

---

## Recommended order of work

1. **This week:** H2 migration (scope `invoice_*`, `landing_pages`) and decide on/disable `/api/onboard`; H3 chat limiter + Anthropic spend cap; set `INVOICE_VIEW_SECRET` and `CRON_SECRET` in Vercel if not already (M2); run the `pg_policies` query.
2. **Next:** H1 (replace CRM service-role key with a scoped role/webhook, rotate key); M1 (POST-confirm interstitials); M3 (encrypt Plaid tokens); M4 (shared rate-limit store).
3. **Then:** remove Payload + `npm audit fix` + bump Next (M7/M8); nonce-based CSP (M6); ILIKE gate fix (M9); Low items.

## Questions / assumptions to confirm

- Is the Supabase project `lzynidkwnvwdpyluiqhg` shared by the website, billing app and onboarded tenants? (I assumed yes from `docs/SECURITY_HARDENING.md` and `0031`-`0033`.)
- Is `/signup` intended to be public on crecotx.com ("VultStack")? If it belongs on another domain/project, H2 shrinks considerably.
- Are `INVOICE_VIEW_SECRET`, `CRON_SECRET`, `STRIPE_WEBHOOK_SECRET`, `RECAPTCHA_SECRET_KEY` actually set in Vercel production? The code behaves differently (fail-open or fallback-to-service-role) if they are not.
- What do migrations 0035-0038 contain, and are they applied?
