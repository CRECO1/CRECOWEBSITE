-- ============================================================================
-- CRECO – Admin RLS policies
--
-- The 0001_init migration enabled Row Level Security and added PUBLIC READ
-- policies (so the public site can fetch listings, agents, etc.), but did NOT
-- add WRITE policies. As a result, the admin dashboard could not persist
-- changes — INSERTs and UPDATEs from the admin (using the publishable/anon key
-- with a signed-in user session) were silently dropped.
--
-- This migration grants INSERT/UPDATE/DELETE on all content tables to any
-- authenticated user. The admin pages already require sign-in via Supabase
-- Auth, so this effectively means: anyone with an admin Supabase Auth account
-- can manage content. Tighten further later (e.g. role-based) if you add
-- agent-level users who shouldn't have full edit rights.
-- ============================================================================

-- ---- site_settings: authenticated users can UPDATE the singleton row -------
drop policy if exists "authenticated update site_settings" on public.site_settings;
create policy "authenticated update site_settings"
  on public.site_settings for update
  to authenticated
  using (true)
  with check (true);

-- ---- listings: authenticated users can INSERT / UPDATE / DELETE ------------
drop policy if exists "authenticated insert listings" on public.listings;
drop policy if exists "authenticated update listings" on public.listings;
drop policy if exists "authenticated delete listings" on public.listings;
create policy "authenticated insert listings" on public.listings for insert to authenticated with check (true);
create policy "authenticated update listings" on public.listings for update to authenticated using (true) with check (true);
create policy "authenticated delete listings" on public.listings for delete to authenticated using (true);

-- ---- agents ----------------------------------------------------------------
drop policy if exists "authenticated insert agents" on public.agents;
drop policy if exists "authenticated update agents" on public.agents;
drop policy if exists "authenticated delete agents" on public.agents;
create policy "authenticated insert agents" on public.agents for insert to authenticated with check (true);
create policy "authenticated update agents" on public.agents for update to authenticated using (true) with check (true);
create policy "authenticated delete agents" on public.agents for delete to authenticated using (true);

-- ---- submarkets ------------------------------------------------------------
drop policy if exists "authenticated insert submarkets" on public.submarkets;
drop policy if exists "authenticated update submarkets" on public.submarkets;
drop policy if exists "authenticated delete submarkets" on public.submarkets;
create policy "authenticated insert submarkets" on public.submarkets for insert to authenticated with check (true);
create policy "authenticated update submarkets" on public.submarkets for update to authenticated using (true) with check (true);
create policy "authenticated delete submarkets" on public.submarkets for delete to authenticated using (true);

-- ---- testimonials ----------------------------------------------------------
drop policy if exists "authenticated insert testimonials" on public.testimonials;
drop policy if exists "authenticated update testimonials" on public.testimonials;
drop policy if exists "authenticated delete testimonials" on public.testimonials;
create policy "authenticated insert testimonials" on public.testimonials for insert to authenticated with check (true);
create policy "authenticated update testimonials" on public.testimonials for update to authenticated using (true) with check (true);
create policy "authenticated delete testimonials" on public.testimonials for delete to authenticated using (true);

-- ---- leads -----------------------------------------------------------------
-- Public INSERT is already allowed (so contact / tenant-needs forms work).
-- Authenticated users (admins) can READ, UPDATE (e.g. mark contacted), and DELETE.
drop policy if exists "authenticated read leads" on public.leads;
drop policy if exists "authenticated update leads" on public.leads;
drop policy if exists "authenticated delete leads" on public.leads;
create policy "authenticated read leads"   on public.leads for select to authenticated using (true);
create policy "authenticated update leads" on public.leads for update to authenticated using (true) with check (true);
create policy "authenticated delete leads" on public.leads for delete to authenticated using (true);
