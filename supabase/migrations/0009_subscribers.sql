-- ============================================================================
-- CRECO – Email subscribers
--
-- Separate from `leads` because the lifecycle is different:
--   - leads = inquiries with intent to transact (filled out a form, expects
--     a broker to follow up)
--   - subscribers = passive opt-in audience (newsletter, property alerts,
--     downloaded a lead magnet) — owned by marketing, not the deal team
--
-- subscription_type lets us segment what they signed up for, since unsubscribe
-- behavior and email cadence differ. filters (jsonb) is used by property-alerts
-- subscribers to store their search criteria so we can match new listings.
-- ============================================================================

create table if not exists public.subscribers (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null,
  name               text,
  subscription_type  text not null
                     check (subscription_type in ('newsletter', 'property-alerts', 'lead-magnet')),
  -- Search criteria for property-alerts subscribers
  -- e.g. { property_types: ['warehouse'], submarkets: ['Northeast'], size_min: 5000, size_max: 30000, transaction_type: 'lease' }
  filters            jsonb,
  -- Which page / context they signed up from
  source             text,
  -- For lead magnets: which asset they downloaded
  asset_slug         text,
  -- Confirmation flow (opt-in confirmation, currently single opt-in)
  confirmed_at       timestamptz default now(),
  unsubscribed_at    timestamptz,
  -- Free-text notes from CRM
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- One row per (email, subscription_type) combination — same person can be on
-- the newsletter AND property alerts independently.
create unique index if not exists subscribers_email_type_unique
  on public.subscribers (lower(email), subscription_type)
  where unsubscribed_at is null;

create index if not exists subscribers_subscription_type_idx
  on public.subscribers (subscription_type)
  where unsubscribed_at is null;

create index if not exists subscribers_source_idx
  on public.subscribers (source);

-- updated_at trigger
do $$ begin
  create trigger subscribers_set_updated_at
    before update on public.subscribers
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.subscribers enable row level security;

drop policy if exists "public insert subscribers"        on public.subscribers;
drop policy if exists "authenticated read subscribers"   on public.subscribers;
drop policy if exists "authenticated update subscribers" on public.subscribers;
drop policy if exists "authenticated delete subscribers" on public.subscribers;

-- Anyone (anon) can sign up via the website forms. No public read.
create policy "public insert subscribers"        on public.subscribers for insert to anon, authenticated with check (true);
create policy "authenticated read subscribers"   on public.subscribers for select to authenticated using (true);
create policy "authenticated update subscribers" on public.subscribers for update to authenticated using (true) with check (true);
create policy "authenticated delete subscribers" on public.subscribers for delete to authenticated using (true);
