-- ============================================================================
-- CRECO – Landing pages (admin-editable)
--
-- Adds a `landing_pages` table that holds CMS-editable copy for the SEO
-- keyword landing pages and the owner-services page. Each row is identified
-- by `slug` matching the route — e.g., 'texas-retail-space-for-lease',
-- 'owner-services'.
--
-- The page components fetch DB content at request time and merge with their
-- hardcoded fallback config (so the site keeps working even if a row is
-- missing). Admin updates show on the live site immediately on next request.
-- ============================================================================

create table if not exists public.landing_pages (
  slug              text primary key,
  title             text not null,                       -- admin display name
  meta_title        text,                                -- <title> tag
  meta_description  text,                                -- meta description
  eyebrow           text,                                -- hero overline
  h1                text,                                -- hero headline
  subhead           text,                                -- hero subheadline

  -- Long-form intro paragraphs (used by /owner-services)
  intro_paragraphs  jsonb default '[]'::jsonb,           -- string[]

  -- Three "why this market matters" cards (used by 4 property landing pages)
  market_bullets    jsonb default '[]'::jsonb,           -- {title, body}[]

  -- "Why CRECO" / advantage bullet list (used by all)
  why_bullets       jsonb default '[]'::jsonb,           -- string[]

  -- FAQ entries (used by all)
  faqs              jsonb default '[]'::jsonb,           -- {q, a}[]

  updated_at        timestamptz not null default now()
);

-- ---- updated_at trigger ----------------------------------------------------
do $$ begin
  create trigger landing_pages_set_updated_at
    before update on public.landing_pages
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

-- ---- RLS -------------------------------------------------------------------
alter table public.landing_pages enable row level security;

drop policy if exists "public read landing_pages"        on public.landing_pages;
drop policy if exists "authenticated insert landing_pages" on public.landing_pages;
drop policy if exists "authenticated update landing_pages" on public.landing_pages;
drop policy if exists "authenticated delete landing_pages" on public.landing_pages;

create policy "public read landing_pages"
  on public.landing_pages for select using (true);

create policy "authenticated insert landing_pages"
  on public.landing_pages for insert to authenticated with check (true);

create policy "authenticated update landing_pages"
  on public.landing_pages for update to authenticated using (true) with check (true);

create policy "authenticated delete landing_pages"
  on public.landing_pages for delete to authenticated using (true);
