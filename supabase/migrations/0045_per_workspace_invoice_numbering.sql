-- 0045_per_workspace_invoice_numbering.sql
--
-- Move invoice numbering into the database so it is atomic and per-workspace.
-- The app derived the number from a live count(*) of invoices in the year and
-- relied on a GLOBAL unique constraint. Two problems: (a) under a race (cron +
-- manual create, or two tabs) both callers read the same count, compute the
-- same number, and one insert fails the unique check — a legitimate invoice
-- silently doesn't get created; (b) the moment a second workspace issues
-- invoices, both tenants compute INV-YYYY-1001 and collide on the global
-- constraint. Per your choice, each workspace now gets its own sequence.
--
-- A per-(workspace, year) counter is bumped atomically inside a BEFORE INSERT
-- trigger (so concurrent inserts get distinct numbers), and uniqueness is
-- scoped to (workspace_id, invoice_number). Existing INV-2026-10xx numbering
-- continues seamlessly via the backfill.

-- 1. Per-workspace, per-year counter.
create table if not exists public.invoice_counters (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  year         int  not null,
  last_seq     int  not null,
  primary key (workspace_id, year)
);

-- 2. Backfill so the next number continues from the current max per (ws, year).
insert into public.invoice_counters (workspace_id, year, last_seq)
select workspace_id,
       (substring(invoice_number from 'INV-(\d{4})-'))::int             as yr,
       max((substring(invoice_number from '-(\d+)$'))::int)             as last_seq
from public.invoices
where invoice_number ~ '^INV-\d{4}-\d+$'
group by workspace_id, (substring(invoice_number from 'INV-(\d{4})-'))::int
on conflict (workspace_id, year)
  do update set last_seq = greatest(public.invoice_counters.last_seq, excluded.last_seq);

-- 3. Atomic allocation on insert — the DB owns the number. Runs BEFORE INSERT
--    so it fills invoice_number ahead of the NOT NULL + uniqueness checks; any
--    value the app sends is overridden.
create or replace function public.assign_invoice_number()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  yr  int := extract(year from NEW.issue_date)::int;
  seq int;
begin
  insert into public.invoice_counters (workspace_id, year, last_seq)
    values (NEW.workspace_id, yr, 1001)
    on conflict (workspace_id, year)
      do update set last_seq = public.invoice_counters.last_seq + 1
    returning last_seq into seq;
  NEW.invoice_number := 'INV-' || yr::text || '-' || seq::text;
  return NEW;
end;
$$;

drop trigger if exists trg_assign_invoice_number on public.invoices;
create trigger trg_assign_invoice_number
  before insert on public.invoices
  for each row execute function public.assign_invoice_number();

-- 4. Scope uniqueness to the workspace (was global unique(invoice_number)).
alter table public.invoices drop constraint if exists invoices_invoice_number_key;
alter table public.invoices
  add constraint invoices_workspace_invoice_number_key unique (workspace_id, invoice_number);
