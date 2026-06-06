-- ============================================================================
-- Add workspace_id to every billing table — multi-tenancy column rollout
-- ============================================================================
-- All existing billing rows belong to the CRECO workspace today. This
-- migration:
--   1. Adds a nullable workspace_id column to every billing table.
--   2. Backfills every existing row with CRECO's workspace_id.
--   3. Tightens the column to NOT NULL (now safe because every row has a value).
--   4. Adds a workspace_id index on each table for query performance.
--
-- IMPORTANT: this migration does NOT change RLS policies. The existing
-- billing_admin_* policies still gate on is_billing_admin() and continue
-- to work exactly as before. App code can read/write as it always has;
-- the workspace_id column is dormant until migration 0033 swaps the
-- policies to use it.
--
-- Sequencing:
--   0031 ✓ (workspaces + helper + seed) — applied
--   0032 — this file
--   <app code update + deploy>
--   0033 — RLS cutover (the breaking moment)
-- ============================================================================

do $$
declare
  default_ws_id uuid;
  billing_tables text[] := array[
    'invoices',
    'invoice_line_items',
    'invoice_settings',
    'invoice_reminders',
    'invoice_email_events',
    'expenses',
    'clients',
    'contractors',
    'properties',
    'recurring_invoice_templates',
    'recurring_invoice_line_items',
    'bank_accounts',
    'bank_transactions',
    'activity_log'
  ];
  t text;
begin
  -- Resolve the CRECO workspace id. Fail loudly if 0031 wasn't applied.
  select id into default_ws_id from public.workspaces where slug = 'creco';
  if default_ws_id is null then
    raise exception 'CRECO workspace not found; apply migration 0031 first';
  end if;
  raise notice 'CRECO workspace_id = %', default_ws_id;

  -- Per-table: add column (nullable first), backfill, then tighten to NOT NULL.
  -- We do this in a loop with EXECUTE so the SQL stays compact and the
  -- list of tables lives in one place.
  foreach t in array billing_tables loop
    -- Skip tables that don't exist in this project (defensive — some
    -- tables like recurring_* and bank_* may not be present in every
    -- environment).
    if not exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      raise notice 'skip %: table not found', t;
      continue;
    end if;

    -- 1. Add nullable column with FK to workspaces.
    execute format(
      'alter table public.%I add column if not exists workspace_id uuid references public.workspaces(id) on delete restrict',
      t
    );

    -- 2. Backfill any null rows to the CRECO workspace.
    execute format(
      'update public.%I set workspace_id = $1 where workspace_id is null',
      t
    ) using default_ws_id;

    -- 3. Tighten to NOT NULL. Safe now — every row has a value.
    execute format(
      'alter table public.%I alter column workspace_id set not null',
      t
    );

    -- 4. Index for the predicate every future query will use.
    execute format(
      'create index if not exists %I on public.%I (workspace_id)',
      t || '_workspace_id_idx', t
    );

    raise notice '✓ %: workspace_id added + backfilled + indexed', t;
  end loop;
end $$;

-- ── invoice_settings: special case ──────────────────────────────────────────
-- This table was designed as a singleton (id integer primary key, check
-- id = 1). Multi-tenancy means each workspace needs its own settings row.
-- We don't change the primary key in this migration (would break too
-- much code at once); instead the app layer reads by workspace_id and
-- the old `eq('id', 1)` filter gets removed in app code (handled in the
-- workspace_id-scoping update). For now there's one settings row and
-- it's associated with the CRECO workspace.
--
-- Future migration will drop the id=1 constraint entirely, but doing it
-- here would coordinate badly with un-updated app code. Defer.
