# AI search (GEO/AEO) — how crecotx.com is set up

| Piece | Where | Notes |
|---|---|---|
| robots.txt | `src/app/robots.ts` | Explicit allow group for every AI crawler (OpenAI, Anthropic, Perplexity, xAI, Google-Extended/GoogleOther, Apple, Bing, Amazon, Meta, ByteDance, Common Crawl, Diffbot, Cohere, Mistral, DuckDuckGo, You.com…). Named groups ignore the `*` group, so the private-path disallows are repeated. |
| llms.txt | `public/llms.txt` (static) | Index + "Quick answers". The "Quick answers" text is copied from `CORE_ANSWERS` in `src/lib/answers.ts` — update both together. |
| llms-full.txt | `src/app/llms-full.txt/route.ts` (ISR 30 min) | Built from the same modules the pages render from, including live listings. |
| `<link rel="alternate">` to both | `src/app/layout.tsx` | Discovery hint in every page's `<head>`. |
| JSON-LD | `src/lib/schema.ts`, `<JsonLd>` | Org/RealEstateAgent/LocalBusiness + WebSite in root layout; Service, FAQPage, RealEstateListing, Article, BreadcrumbList on pages. Change facts only in `schema.ts` / `brand.ts`. |
| Answer-style Q&A | `src/lib/answers.ts` | One definition rendered on `/`, `/fair-oaks-ranch-commercial-real-estate`, `/market-brief`, `/markets`, `/llms.txt`, `/llms-full.txt`. |
| Crawler tracker | `src/lib/crawler-hits.ts`, `docs/crawler-tracker.md` | `crawler_hits` table (shared with the Elkhorn site — filter `host`). |
| IndexNow | `scripts/indexnow-ping.ts`, key file `public/9246f38b795b1b2989ff05deba06c6f6.txt` | See below. |

## IndexNow (Bing / Copilot / ChatGPT Search / Yandex)

Run **after** a deploy is live:

```bash
npm run indexnow                 # key pages (home, services, city pages, llms files…)
npm run indexnow -- /new-page    # one-off paths
npm run indexnow -- --sitemap    # every URL in the live sitemap
```

Google does not read IndexNow.

## Manual steps for Zack (need his logins)

### Bing Webmaster Tools (feeds Bing, Copilot and ChatGPT Search)
1. Go to https://www.bing.com/webmasters and sign in with a Microsoft, Google or Facebook account (use one the business will keep).
2. **Add a site** → `https://www.crecotx.com`.
3. Verify ownership, easiest first:
   - **Import from Google Search Console** (if crecotx.com is already verified there) — one click, no code changes; or
   - **DNS**: add the CNAME record Bing shows to the crecotx.com DNS (Cloudflare); or
   - **XML file / meta tag**: Bing gives a `BingSiteAuth.xml` or `msvalidate.01` tag — send it to Claude and it will be added and committed.
4. **Sitemaps** → Submit `https://www.crecotx.com/sitemap.xml`.
5. **IndexNow** page in the dashboard should show submissions once `npm run indexnow` has run.
6. Optional: turn on **AI Performance / Copilot citations** reports if Bing offers them for the property.

### Google Search Console
Request indexing for `/`, `/market-brief` and `/fair-oaks-ranch-commercial-real-estate` after the next deploy (IndexNow does not reach Google).

## Open facts (do not guess — confirm with Zack)
- Social profiles for `sameAs`: LinkedIn company page (footer link `linkedin.com/company/crecotx` returned 404), Facebook, Instagram, Crexi. Only add confirmed URLs in `src/lib/schema.ts`.
- Business hours are Mon–Fri 8:00 AM–5:30 PM Central (confirmed by Zack Oct 2026) in `BUSINESS.hours` and the `openingHoursSpecification` in `schema.ts`.
- When the first Market Brief edition publishes, replace the pre-launch copy and `MARKET_BRIEF_FAQS` in `src/lib/answers.ts`.

## Conversion tracking for AI-referred visitors

Built on the first-party tracker (`src/lib/tracker.ts` → the CRM project's `site_pageviews` / `site_events`).

- **ai_source** — each visit is labelled once per tab session from `utm_source` (ChatGPT adds `utm_source=chatgpt.com`) or the referrer: chatgpt, perplexity, claude, gemini, copilot, grok, meta_ai, deepseek, mistral, you, phind, poe, duckai. Stored in the pageview `env`, the first-touch snapshot, and every event's `meta`. AI visits that arrive with no referrer look like direct traffic and can't be labelled.
- **home_click** — first three homepage clicks (`label = "<section>:<id>"`, `value` = seconds since load, `meta.n` = 1–3). Sections are `data-track-section` attributes; ids are `data-track-id` or the destination path. No visitor text is read.
- **intent_reached** — arrival on get-started / valuation / contact / list / sell / development / tenant-needs.
- **Gate** — DNT / Global Privacy Control switch the tracker off entirely (no id, no storage, no beacons). Bots, datacenter visitors and team devices are rejected by `analytics-gate.shouldTrackVisitor`, same as GA and Clarity.
- **Retention** — 12 months, enforced daily by `/api/cron/tracking-retention` (crecotx rows only; `?dry=1` to preview).
- **Reading it** — run `supabase/crm/ai_funnel_30d.sql` once in the **CRM** Supabase SQL editor, then `select * from ai_funnel_30d;`, `ai_vs_other_funnel_30d`, `home_first_click_30d`. At current volume (a handful of AI sessions a week) read the leading indicators (intent, call/text taps), not the lead rate.
- **Phone taps are the proxy for calls** — there is no call-tracking number.

### Pending Zack decisions (both stubbed in `src/lib/hero-proof.ts`)
- Google rating in the hero: set `SHOW_GOOGLE_RATING = true`.
- Response-time promise: set `RESPONSE_TIME_PROMISE` to his exact wording; it renders after the AI welcome line.
