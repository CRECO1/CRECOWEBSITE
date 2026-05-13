-- ============================================================================
-- CRECO – Invoicing
--
-- Custom invoicing in the admin: create invoices, attach line items, generate
-- PDFs, send via email, track status. Designed to be self-contained today and
-- Stripe-ready later — `stripe_payment_link_url` can be pasted manually now
-- (one-off Stripe Payment Links created in the Stripe dashboard) and will
-- be auto-populated once the API integration lands.
--
-- Money is `numeric(12,2)` everywhere. Avoids float drift. 12,2 covers up to
-- $9,999,999,999.99 — plenty for any single commercial real estate invoice.
-- ============================================================================

-- ── invoices ───────────────────────────────────────────────────────────────
create table if not exists public.invoices (
  id                       uuid primary key default gen_random_uuid(),
  invoice_number           text not null unique,

  -- Client info, denormalized. Most invoice clients aren't in any other table
  -- and we don't want a row deletion in `leads`/`subscribers` to cascade
  -- through billing records.
  client_name              text not null,
  client_email             text not null,
  client_company           text,
  -- Free-form multi-line address. Renders verbatim onto the PDF.
  client_address           text,

  -- Dates
  issue_date               date not null default current_date,
  due_date                 date not null,

  -- Status lifecycle: draft → sent → paid (or → overdue / → void)
  status                   text not null default 'draft'
                           check (status in ('draft', 'sent', 'paid', 'overdue', 'void')),

  -- Money (subtotal + tax = total; we store all three so the PDF and emails
  -- don't have to recompute and risk rounding mismatches with the line items)
  subtotal                 numeric(12, 2) not null default 0,
  tax_rate                 numeric(6, 4) not null default 0,    -- 0.0825 = 8.25%
  tax_amount               numeric(12, 2) not null default 0,
  total                    numeric(12, 2) not null default 0,

  -- Optional context — useful for commercial brokerage invoices
  property_reference       text,        -- e.g. "8000 Fair Oaks Pkwy" or a listing slug
  notes                    text,        -- memo shown to client on the PDF
  internal_notes           text,        -- visible only to CRECO admins

  -- Payment instructions / links
  stripe_payment_link_url  text,        -- Stripe Payment Link URL, manual today, API-driven later
  payment_terms            text default 'Net 30',

  -- Tracking
  sent_at                  timestamptz,
  paid_at                  timestamptz,
  paid_amount              numeric(12, 2),
  paid_method              text,        -- "Stripe", "ACH", "Check", "Other"

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists invoices_status_idx           on public.invoices (status) where status <> 'void';
create index if not exists invoices_due_date_idx         on public.invoices (due_date) where status in ('sent', 'overdue');
create index if not exists invoices_client_email_idx     on public.invoices (lower(client_email));

-- ── invoice_line_items ─────────────────────────────────────────────────────
create table if not exists public.invoice_line_items (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references public.invoices(id) on delete cascade,
  description   text not null,
  quantity      numeric(12, 4) not null default 1,        -- 4 decimals to allow fractional hours / acres
  rate          numeric(12, 2) not null default 0,
  amount        numeric(12, 2) not null default 0,        -- = quantity * rate; stored for snapshot integrity
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists invoice_line_items_invoice_id_idx on public.invoice_line_items (invoice_id, sort_order);

-- updated_at trigger (same shared function the other tables use)
do $$ begin
  create trigger invoices_set_updated_at
    before update on public.invoices
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

-- ── RLS ────────────────────────────────────────────────────────────────────
-- Invoices contain client billing info. No public read or write. Authenticated
-- (admin) users get full CRUD; the anon role gets nothing.
alter table public.invoices             enable row level security;
alter table public.invoice_line_items   enable row level security;

drop policy if exists "authenticated read invoices"          on public.invoices;
drop policy if exists "authenticated insert invoices"        on public.invoices;
drop policy if exists "authenticated update invoices"        on public.invoices;
drop policy if exists "authenticated delete invoices"        on public.invoices;

create policy "authenticated read invoices"   on public.invoices for select to authenticated using (true);
create policy "authenticated insert invoices" on public.invoices for insert to authenticated with check (true);
create policy "authenticated update invoices" on public.invoices for update to authenticated using (true) with check (true);
create policy "authenticated delete invoices" on public.invoices for delete to authenticated using (true);

drop policy if exists "authenticated read invoice_line_items"   on public.invoice_line_items;
drop policy if exists "authenticated insert invoice_line_items" on public.invoice_line_items;
drop policy if exists "authenticated update invoice_line_items" on public.invoice_line_items;
drop policy if exists "authenticated delete invoice_line_items" on public.invoice_line_items;

create policy "authenticated read invoice_line_items"   on public.invoice_line_items for select to authenticated using (true);
create policy "authenticated insert invoice_line_items" on public.invoice_line_items for insert to authenticated with check (true);
create policy "authenticated update invoice_line_items" on public.invoice_line_items for update to authenticated using (true) with check (true);
create policy "authenticated delete invoice_line_items" on public.invoice_line_items for delete to authenticated using (true);
