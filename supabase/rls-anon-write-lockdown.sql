-- ============================================================================
-- Remove the last anon write grants  (crecotx.com · project lzynidkwnvwdpyluiqhg)
--
-- CONTEXT
-- Supabase grants the `anon` and `authenticated` roles full table privileges by
-- default (SELECT/INSERT/UPDATE/DELETE on everything in `public`), so RLS is the
-- only thing standing between the publishable key — which ships in the browser
-- bundle — and the data. An audit of all 28 tables found RLS enabled everywhere
-- and correctly scoped, with exactly two exceptions:
--
--     leads        "public insert leads"        INSERT TO {anon, authenticated} WITH CHECK (true)
--     subscribers  "public insert subscribers"  INSERT TO {anon, authenticated} WITH CHECK (true)
--
-- Those let anyone holding the public key write arbitrary rows into the inbound
-- funnel (spam, poisoned lead data). Nothing else was anon-writable, and no
-- internal table was anon-readable.
--
-- ORDER OF OPERATIONS — this file must be applied AFTER the code change that
-- moves the four public form routes onto the service-role key:
--     src/app/api/leads/route.ts
--     src/app/api/subscribe/route.ts
--     src/app/api/inquiry/route.ts
--     src/app/api/tour-request/route.ts
-- They previously inserted with NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, i.e. they
-- depended on the very policies dropped below. Applying this first would break
-- newsletter signups, which are live (subscribers received rows as recently as
-- 2026-09-14). service_role bypasses RLS, so the routes are unaffected by this.
--
-- Public marketing reads are deliberately untouched: agents, landing_pages,
-- listings, site_settings, submarkets and testimonials keep their
-- "public read ..." SELECT policies, because the site renders them with the
-- anon key and they contain nothing private.
--
-- Idempotent: safe to re-run.
-- ============================================================================

begin;

-- leads — inbound contact/valuation/tour submissions
drop policy if exists "public insert leads" on public.leads;
create policy "authenticated insert leads" on public.leads
  for insert to authenticated
  with check (true);

-- subscribers — newsletter signups
drop policy if exists "public insert subscribers" on public.subscribers;
create policy "authenticated insert subscribers" on public.subscribers
  for insert to authenticated
  with check (true);

commit;

-- ============================================================================
-- VERIFY (read-only)
--
-- 1) No policy anywhere should still name the anon role:
--      select tablename, policyname, cmd, roles::text
--        from pg_policies
--       where schemaname='public' and roles::text like '%anon%';
--    Expected: zero rows.
--
-- 2) With the publishable key, every table must reject INSERT (401 / 42501),
--    and the six marketing tables must still return rows to SELECT.
--
-- 3) The public site must still render: /, /listings, /sold, /submarkets, /team.
--
-- ROLLBACK (restores the pre-change behaviour if a form path still needs it):
--   drop policy if exists "authenticated insert leads" on public.leads;
--   create policy "public insert leads" on public.leads
--     for insert to anon, authenticated with check (true);
--   drop policy if exists "authenticated insert subscribers" on public.subscribers;
--   create policy "public insert subscribers" on public.subscribers
--     for insert to anon, authenticated with check (true);
-- ============================================================================
