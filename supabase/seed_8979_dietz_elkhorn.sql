-- Seed landing_pages row for /8979-dietz-elkhorn
--
-- After this runs, the admin will see "8979 Dietz Elkhorn" in the
-- Landing Pages tab and can edit:
--   - SEO title + meta description
--   - Hero overline (eyebrow), headline (h1), subhead
--   - The 4 "Why now" market_bullets (title + body each)
--   - The 6 FAQ entries
--
-- Other sections on the page (stat row, tenant categories, asset spec,
-- lease terms, process steps, lead form) remain in code. To change
-- those, edit src/app/8979-dietz-elkhorn/page.tsx.
--
-- This is an UPSERT so re-running won't error. ON CONFLICT updates the
-- row's content so you can edit this file + re-run to push a new seed
-- baseline (NOT the normal flow — normal edits go through the admin UI).

insert into public.landing_pages (
  slug,
  title,
  meta_title,
  meta_description,
  eyebrow,
  h1,
  subhead,
  intro_paragraphs,
  market_bullets,
  why_bullets,
  faqs
) values (
  '8979-dietz-elkhorn',
  '8979 Dietz Elkhorn',
  '8979 Dietz Elkhorn — New Retail Center Pre-Leasing | Fair Oaks Ranch | CRECO',
  '8979 Dietz Elkhorn — a new ±20,000 SF neighborhood retail center in Fair Oaks Ranch, TX. Ten ±1,500 SF suites, demisable, with end-cap F&B and food-ready bays. Pre-leasing now — local operators welcome. Median HHI $168K, 2x Texas median. Represented by CRECO.',
  'Now Pre-Leasing · 8979 Dietz Elkhorn · Fair Oaks Ranch, TX',
  '8979 Dietz Elkhorn.',
  'A new ±20,000 SF neighborhood retail center on Dietz Elkhorn in Fair Oaks Ranch — ten demisable ±1,500 SF suites, two F&B end caps with patio envelopes, and 2-3 food-ready bays.',
  '[]'::jsonb,
  $$[
    {"title":"$168K median household income","body":"2x the Texas median, 2x+ the US median. Captive daily-needs demand with discretionary spend that supports premium service + specialty concepts."},
    {"title":"~12,600 residents + Hill Country pull","body":"Fair Oaks Ranch plus traffic from Leon Springs, Boerne, and NW Bexar. Median age 46 — established households, loyal to local operators they trust."},
    {"title":"Thin supply of quality small-bay retail","body":"Area asking rents sit mid-$20s to $30 NNN with limited new inventory. A brand-new center with food-ready infrastructure is exactly what the market is short on."},
    {"title":"CRECO is the leasing team","body":"Local broker, local owner relationships, fast decisions. We're recruiting tenants, not waiting on listings. Tours are walked weekly."}
  ]$$::jsonb,
  '[]'::jsonb,
  $$[
    {"q":"How big are the suites and can I combine them?","a":"Standard bays are ±1,500 SF with demising walls designed to combine. Pair two for ±3,000 SF, three for ±4,500 SF — common asks from restaurants, fitness studios, and medical users. End caps and food-ready bays are limited; the earliest LOIs get first pick."},
    {"q":"Can my food concept work here?","a":"Yes. We are pre-plumbing 2-3 suites with grease lines, venting, and 3-phase power so F&B operators do not have to retrofit. End caps include a patio envelope. Coffee, fast-casual, brunch, bakery, and wine bar concepts are all in scope."},
    {"q":"What does NNN actually cost me?","a":"Triple-net is the tenant share of taxes, insurance, and common-area maintenance. We will share a current NNN estimate when we send the LOI; for centers of this size it typically lands meaningfully below the base rent."},
    {"q":"When does the center open?","a":"Delivery is in active planning. We are pre-leasing now toward a target of 40-50% committed before delivery and 90% within 12 months of opening. The fastest path to picking your suite is to start the conversation now."},
    {"q":"What kind of operators are you looking for?","a":"Phase 1 is local-first: established operators from Fair Oaks Ranch, Boerne, Leon Springs, Stone Oak, and greater NW San Antonio who want a Fair Oaks Ranch location. National and franchise tenants enter selectively in Phase 2 after stabilization."},
    {"q":"Do I need a tenant rep broker?","a":"You do not. CRECO represents the landlord and works directly with owner-operators, but we co-broke with tenant-rep brokers at a market commission if that is your preference. Either path gets you the same straight answers."}
  ]$$::jsonb
)
on conflict (slug) do update set
  title            = excluded.title,
  meta_title       = excluded.meta_title,
  meta_description = excluded.meta_description,
  eyebrow          = excluded.eyebrow,
  h1               = excluded.h1,
  subhead          = excluded.subhead,
  market_bullets   = excluded.market_bullets,
  faqs             = excluded.faqs,
  updated_at       = now();
