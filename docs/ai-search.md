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
