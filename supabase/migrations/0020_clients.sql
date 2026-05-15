-- ============================================================================
-- Reusable clients (billing-side)
-- ============================================================================
-- Until now the invoice form stored client_name / email / company / address
-- as denormalized text on every invoice row — fine for one-off billing,
-- annoying when you re-bill the same client (re-type the address every
-- time, no single place to update if their info changes).
--
-- This table is the canonical record. Invoices keep the denormalized
-- snapshot columns (useful for historical "what did we bill them as
-- back then?" purposes and so a deleted client doesn't break old
-- invoices), but also point at this row via client_id when one exists.
--
-- New invoices/recurring templates upsert this table by lowercased
-- email on save, so re-billing the same person is automatic.

create table if not exists public.clients (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  email              text not null,
  company            text,
  address            text,
  phone              text,
  property_reference text,
  notes              text,
  active             boolean default true not null,
  created_at         timestamptz default now() not null,
  updated_at         timestamptz default now() not null
);

-- Dedup by lowercased email — clients on the billing side are
-- identified by email (mirrors the invoice + statement flow).
create unique index if not exists clients_email_unique_idx
  on public.clients (lower(email));

create index if not exists clients_active_name_idx
  on public.clients (active, name);

-- Soft link from invoice → client. SET NULL on delete so deleting a
-- client doesn't cascade-destroy invoices (those carry the snapshot
-- columns and can stand alone).
alter table public.invoices
  add column if not exists client_id uuid references public.clients(id) on delete set null;

create index if not exists invoices_client_id_idx
  on public.invoices (client_id)
  where client_id is not null;

-- Same for recurring templates — when the cron generates a new invoice
-- from a template, the generated invoice inherits the template's
-- client_id (set up in the generate helper).
alter table public.recurring_invoice_templates
  add column if not exists client_id uuid references public.clients(id) on delete set null;

create index if not exists recurring_templates_client_id_idx
  on public.recurring_invoice_templates (client_id)
  where client_id is not null;

-- updated_at trigger
drop trigger if exists tg_clients_updated_at on public.clients;
create trigger tg_clients_updated_at
  before update on public.clients
  for each row execute function public.tg_set_updated_at();

-- RLS — authenticated users (the admin) can do everything.
alter table public.clients enable row level security;

drop policy if exists "admin_can_all_clients" on public.clients;
create policy "admin_can_all_clients"
  on public.clients for all to authenticated using (true) with check (true);

-- ── Backfill from existing invoice client snapshots ──────────────────────
-- For every distinct (client_email, latest client_name + company + address)
-- already in invoices, create a client row. This makes the "already-billed
-- clients show up in the typeahead immediately" behaviour kick in from
-- day one without forcing the operator to re-enter anything.
insert into public.clients (name, email, company, address, property_reference, created_at)
select distinct on (lower(i.client_email))
  i.client_name,
  i.client_email,
  i.client_company,
  i.client_address,
  i.property_reference,
  min(i.created_at) over (partition by lower(i.client_email))
from public.invoices i
where i.client_email is not null and i.client_email != ''
order by lower(i.client_email), i.created_at desc
on conflict (lower(email)) do nothing;

-- Then back-link existing invoices to the matching client row by email.
update public.invoices i
set client_id = c.id
from public.clients c
where i.client_id is null
  and lower(i.client_email) = lower(c.email);

-- Same backfill for recurring templates
update public.recurring_invoice_templates t
set client_id = c.id
from public.clients c
where t.client_id is null
  and lower(t.client_email) = lower(c.email);
