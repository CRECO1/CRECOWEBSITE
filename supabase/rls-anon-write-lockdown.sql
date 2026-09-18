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
drop policy if exists "authenticated insert leads" on public.leads;
create policy "authenticated insert leads" on public.leads
  for insert to authenticated
  with check (true);

-- subscribers — newsletter signups
drop policy if exists "public insert subscribers" on public.subscribers;
drop policy if exists "authenticated insert subscribers" on public.subscribers;
create policy "authenticated insert subscribers" on public.subscribers
  for insert to authenticated
  with check (true);

commit;

-- ----------------------------------------------------------------------------
-- 2. Belt and braces: take the write privileges away from `anon` entirely.
--
-- Supabase grants anon INSERT/UPDATE/DELETE/TRUNCATE on every table in `public`
-- by default, which leaves RLS as the single point of failure. Two findings made
-- that worth closing at the privilege level rather than trusting policies alone:
--
--   * `invoices` could not be proven safe empirically. Its policy is
--     `ALL TO authenticated USING (is_workspace_member(workspace_id))`, so anon
--     should be denied — but the RLS check is never reached: the BEFORE INSERT
--     trigger `assign_invoice_number` is SECURITY DEFINER, writes to
--     invoice_counters first, and fails there (23502 / 23503). Proving the point
--     would have meant creating a real invoice and perturbing the invoice-number
--     counter on a live financial table, which is not worth it when the
--     privilege can simply be removed.
--   * `invoice_counters` has RLS enabled and zero policies, yet is written by
--     that SECURITY DEFINER trigger — correct, and unaffected by this revoke.
--
-- anon keeps SELECT: RLS still decides which rows it may read, and the six
-- marketing tables depend on it. service_role and authenticated are untouched.
-- ----------------------------------------------------------------------------

revoke insert, update, delete, truncate on all tables in schema public from anon;

-- Future tables must not silently re-grant these to anon.
alter default privileges in schema public
  revoke insert, update, delete, truncate on tables from anon;

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
