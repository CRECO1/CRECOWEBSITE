-- ============================================================================
-- CRECO – Commercial Real Estate Company
-- Initial Supabase schema
--
-- Run this in your CRECO Supabase project SQL editor (one-time).
-- Payload CMS (`db.push: true` in payload.config.ts) will keep its tables in
-- sync at build time. The tables below back the public-facing pages.
-- ============================================================================

-- ---- listings ---------------------------------------------------------------
create table if not exists public.listings (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique,

  address         text not null,
  city            text not null default 'San Antonio',
  state           text not null default 'TX',
  zip             text,
  submarket       text,

  property_type   text not null default 'office'
                    check (property_type in
                      ('office','warehouse','flex','retail','land','multifamily','mixed-use','industrial')),
  transaction_type text not null default 'lease'
                    check (transaction_type in ('lease','sale','both')),

  sale_price      numeric,
  lease_rate      numeric,
  lease_rate_basis text,

  sqft            integer,
  available_sqft  integer,
  lot_size        numeric,
  zoning          text,
  year_built      integer,

  clear_height    integer,
  dock_doors      integer,
  grade_doors     integer,

  headline        text,
  description     text,
  features        text[],
  images          text[],
  brochure_url    text,
  virtual_tour_url text,

  status          text not null default 'active'
                    check (status in ('active','pending','sold','leased','off-market')),
  listing_date    date,
  closed_date     date,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists listings_status_idx          on public.listings (status);
create index if not exists listings_property_type_idx   on public.listings (property_type);
create index if not exists listings_transaction_type_idx on public.listings (transaction_type);
create index if not exists listings_submarket_idx       on public.listings (submarket);

-- ---- agents -----------------------------------------------------------------
create table if not exists public.agents (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  title            text,
  email            text,
  phone            text,
  bio              text,
  image_url        text,
  license_number   text,
  specialties      text[],
  years_experience integer,
  featured         boolean default false,
  "order"          integer default 99,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists agents_order_idx on public.agents ("order");

-- ---- submarkets -------------------------------------------------------------
create table if not exists public.submarkets (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  highlights  text[],
  zip_codes   text[],
  featured    boolean default false,
  "order"     integer default 99,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists submarkets_order_idx on public.submarkets ("order");

-- ---- testimonials -----------------------------------------------------------
create table if not exists public.testimonials (
  id              uuid primary key default gen_random_uuid(),
  client_name     text not null,
  client_location text,
  quote           text not null,
  rating          smallint default 5 check (rating between 1 and 5),
  image_url       text,
  featured        boolean default false,
  created_at      timestamptz not null default now()
);

-- ---- leads ------------------------------------------------------------------
create table if not exists public.leads (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  company           text,
  email             text not null,
  phone             text,
  message           text,
  property_interest text,
  source            text default 'contact'
                      check (source in ('contact','tenant-needs','listing','owner-inquiry','schedule')),
  status            text default 'new'
                      check (status in ('new','contacted','qualified','tour-scheduled','loi-sent','closed','lost')),
  intake_data       jsonb,
  notes             text,
  assigned_agent_id uuid references public.agents(id) on delete set null,
  created_at        timestamptz not null default now()
);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_source_idx on public.leads (source);
create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- ---- site_settings (singleton, id = 1) --------------------------------------
create table if not exists public.site_settings (
  id                      smallint primary key default 1 check (id = 1),
  site_name               text default 'CRECO – Commercial Real Estate Company',
  phone                   text default '(210) 817-3443',
  email                   text default 'info@crecotx.com',
  address                 text default 'San Antonio, TX',
  hero_headline           text default 'San Antonio Commercial Real Estate',
  hero_subheadline        text default 'Where your real estate ventures find the support they deserve. Office, warehouse, flex, retail, and land — for tenants, owners, and investors across South Texas.',
  hero_image_url          text default '/images/sa-hero.jpg',
  about_headline          text default 'A trailblazing approach to commercial real estate.',
  about_text              text default 'CRECO is built on innovation, expertise, and a relentless commitment to client outcomes. We blend deep San Antonio market knowledge with the analytical rigor you would expect from a national firm — and we keep our roster small enough that every client works directly with a principal.',
  cta_headline            text default 'Need space? Tell us what you''re looking for.',
  cta_subheadline         text default 'Submit your tenant needs in 2 minutes and we''ll send vetted options that match your size, budget, and submarket.',
  stat_sf_transacted      text default '2.4M',
  stat_years_experience   integer default 15,
  stat_satisfaction       text default '98%',
  stat_active_listings    integer default 30,
  updated_at              timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

-- ---- updated_at triggers ----------------------------------------------------
create or replace function public.set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

do $$ begin
  create trigger listings_set_updated_at     before update on public.listings    for each row execute function public.set_updated_at();
  create trigger agents_set_updated_at       before update on public.agents      for each row execute function public.set_updated_at();
  create trigger submarkets_set_updated_at   before update on public.submarkets  for each row execute function public.set_updated_at();
  create trigger site_settings_set_updated_at before update on public.site_settings for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

-- ---- Row Level Security -----------------------------------------------------
-- Public read for marketing tables; writes via Payload (service role) only.
alter table public.listings      enable row level security;
alter table public.agents        enable row level security;
alter table public.submarkets    enable row level security;
alter table public.testimonials  enable row level security;
alter table public.site_settings enable row level security;
alter table public.leads         enable row level security;

drop policy if exists "public read listings"      on public.listings;
drop policy if exists "public read agents"        on public.agents;
drop policy if exists "public read submarkets"    on public.submarkets;
drop policy if exists "public read testimonials"  on public.testimonials;
drop policy if exists "public read site_settings" on public.site_settings;
drop policy if exists "public insert leads"       on public.leads;

create policy "public read listings"      on public.listings      for select using (true);
create policy "public read agents"        on public.agents        for select using (true);
create policy "public read submarkets"    on public.submarkets    for select using (true);
create policy "public read testimonials"  on public.testimonials  for select using (true);
create policy "public read site_settings" on public.site_settings for select using (true);

-- Anyone (anon) can insert a lead via the website forms. No public read.
create policy "public insert leads" on public.leads
  for insert to anon, authenticated with check (true);
