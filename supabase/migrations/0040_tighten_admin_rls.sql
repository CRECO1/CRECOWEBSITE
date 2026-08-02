-- ============================================================================
-- Review the admin_users predicate against your schema, then run in the
-- Supabase SQL editor. Requires self-signup disabled.
-- ============================================================================
-- CRECO – Tighten admin RLS (supersedes the blanket policies from 0002)
--
-- Migration 0002 granted INSERT/UPDATE/DELETE (and, for leads, SELECT) on the
-- content tables to ANY authenticated user via `to authenticated using (true)
-- with check (true)`. That means a bare valid Supabase JWT — not necessarily
-- an admin — could write content. If the project's Auth settings ever permit
-- self-signup, a stranger could mint a JWT and mutate listings/leads/etc.
--
-- This migration re-scopes every one of those blanket write/read policies to
-- ADMINS ONLY, keyed on the admin_users allowlist. Admin identity in this
-- project is modeled by EMAIL, not by auth.uid(): admin_users.id is a random
-- gen_random_uuid() (see 0029), and the membership check everywhere else
-- (is_billing_admin(), src/lib/api-auth.ts, src/middleware.ts) compares
-- lower(admin_users.email) against the JWT email claim. We reuse that exact
-- predicate here so the DB gate matches the app gate.
--
-- Public SELECT policies (added in 0001 so the marketing site can read
-- listings/agents/submarkets/testimonials) and public INSERT on leads (the
-- contact / tenant-needs forms) are intentionally left untouched.
--
-- Idempotent: every policy is DROPped IF EXISTS before CREATE, so re-running
-- is safe. The policy names match 0002 so this cleanly replaces them.
-- ============================================================================

-- The admin membership predicate, inlined into each policy below:
--   exists (
--     select 1 from public.admin_users a
--     where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
--   )

-- ---- site_settings: only admins can UPDATE the singleton row ----------------
drop policy if exists "authenticated update site_settings" on public.site_settings;
create policy "authenticated update site_settings"
  on public.site_settings for update
  to authenticated
  using (
    exists (select 1 from public.admin_users a
            where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  )
  with check (
    exists (select 1 from public.admin_users a
            where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  );

-- ---- listings: only admins can INSERT / UPDATE / DELETE ---------------------
drop policy if exists "authenticated insert listings" on public.listings;
drop policy if exists "authenticated update listings" on public.listings;
drop policy if exists "authenticated delete listings" on public.listings;
create policy "authenticated insert listings" on public.listings for insert to authenticated
  with check (exists (select 1 from public.admin_users a
                      where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))));
create policy "authenticated update listings" on public.listings for update to authenticated
  using (exists (select 1 from public.admin_users a
                 where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))))
  with check (exists (select 1 from public.admin_users a
                      where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))));
create policy "authenticated delete listings" on public.listings for delete to authenticated
  using (exists (select 1 from public.admin_users a
                 where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))));

-- ---- agents -----------------------------------------------------------------
drop policy if exists "authenticated insert agents" on public.agents;
drop policy if exists "authenticated update agents" on public.agents;
drop policy if exists "authenticated delete agents" on public.agents;
create policy "authenticated insert agents" on public.agents for insert to authenticated
  with check (exists (select 1 from public.admin_users a
                      where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))));
create policy "authenticated update agents" on public.agents for update to authenticated
  using (exists (select 1 from public.admin_users a
                 where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))))
  with check (exists (select 1 from public.admin_users a
                      where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))));
create policy "authenticated delete agents" on public.agents for delete to authenticated
  using (exists (select 1 from public.admin_users a
                 where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))));

-- ---- submarkets -------------------------------------------------------------
drop policy if exists "authenticated insert submarkets" on public.submarkets;
drop policy if exists "authenticated update submarkets" on public.submarkets;
drop policy if exists "authenticated delete submarkets" on public.submarkets;
create policy "authenticated insert submarkets" on public.submarkets for insert to authenticated
  with check (exists (select 1 from public.admin_users a
                      where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))));
create policy "authenticated update submarkets" on public.submarkets for update to authenticated
  using (exists (select 1 from public.admin_users a
                 where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))))
  with check (exists (select 1 from public.admin_users a
                      where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))));
create policy "authenticated delete submarkets" on public.submarkets for delete to authenticated
  using (exists (select 1 from public.admin_users a
                 where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))));

-- ---- testimonials -----------------------------------------------------------
drop policy if exists "authenticated insert testimonials" on public.testimonials;
drop policy if exists "authenticated update testimonials" on public.testimonials;
drop policy if exists "authenticated delete testimonials" on public.testimonials;
create policy "authenticated insert testimonials" on public.testimonials for insert to authenticated
  with check (exists (select 1 from public.admin_users a
                      where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))));
create policy "authenticated update testimonials" on public.testimonials for update to authenticated
  using (exists (select 1 from public.admin_users a
                 where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))))
  with check (exists (select 1 from public.admin_users a
                      where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))));
create policy "authenticated delete testimonials" on public.testimonials for delete to authenticated
  using (exists (select 1 from public.admin_users a
                 where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))));

-- ---- leads ------------------------------------------------------------------
-- Public INSERT stays (contact / tenant-needs forms). Only the authenticated
-- READ / UPDATE / DELETE are re-scoped to admins.
drop policy if exists "authenticated read leads" on public.leads;
drop policy if exists "authenticated update leads" on public.leads;
drop policy if exists "authenticated delete leads" on public.leads;
create policy "authenticated read leads" on public.leads for select to authenticated
  using (exists (select 1 from public.admin_users a
                 where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))));
create policy "authenticated update leads" on public.leads for update to authenticated
  using (exists (select 1 from public.admin_users a
                 where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))))
  with check (exists (select 1 from public.admin_users a
                      where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))));
create policy "authenticated delete leads" on public.leads for delete to authenticated
  using (exists (select 1 from public.admin_users a
                 where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))));
