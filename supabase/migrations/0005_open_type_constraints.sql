-- ============================================================================
-- CRECO – Open up listings.property_type and transaction_type
--
-- The original schema CHECK-constrained these columns to a fixed enum. We're
-- relaxing that so admins can save custom property types (e.g. "self-storage",
-- "data center", "automotive service") and custom transaction types if they
-- ever need to ("ground lease", "build-to-suit", etc.).
--
-- Existing rows are preserved unchanged.
-- ============================================================================

-- Drop the original CHECK constraints by name (auto-generated names from
-- inline `check(...)` in 0001_init.sql) — find the actual names first since
-- Postgres autogenerates them.
do $$
declare
  c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.listings'::regclass
      and contype = 'c'
      and (
        pg_get_constraintdef(oid) ilike '%property_type%'
        or pg_get_constraintdef(oid) ilike '%transaction_type%'
      )
  loop
    execute format('alter table public.listings drop constraint %I', c);
  end loop;
end $$;
