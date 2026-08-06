-- 0046_invoice_payments_ledger.sql
--
-- Partial payments via a proper payments ledger. Each payment is one row in
-- invoice_payments; the parent invoice's paid_amount / paid_at / paid_method
-- / status are DERIVED from the sum of its payments by an AFTER trigger. So
-- every payment path (manual "record payment", Plaid apply, future Stripe)
-- keeps the invoice consistent, we get full payment history, and partial
-- payments are first-class. Existing read sites that use invoices.paid_amount
-- / status keep working unchanged because the trigger maintains those columns.

-- 1. Allow the new 'partial' status (0 < paid < total).
alter table public.invoices drop constraint if exists invoices_status_check;
alter table public.invoices
  add constraint invoices_status_check
  check (status in ('draft','sent','paid','overdue','void','partial'));

-- 2. The ledger.
create table if not exists public.invoice_payments (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invoice_id   uuid not null references public.invoices(id) on delete cascade,
  amount       numeric(12,2) not null,
  method       text,                            -- 'Check','ACH','Stripe','Cash','Other'
  paid_at      date not null default current_date,
  notes        text,
  source       text not null default 'manual',  -- 'manual' | 'plaid' | 'stripe' | 'backfill'
  created_at   timestamptz not null default now(),
  created_by   text                             -- actor email, denormalized
);
create index if not exists invoice_payments_invoice_idx   on public.invoice_payments (invoice_id);
create index if not exists invoice_payments_workspace_idx on public.invoice_payments (workspace_id);

alter table public.invoice_payments enable row level security;
drop policy if exists invoice_payments_rw on public.invoice_payments;
create policy invoice_payments_rw on public.invoice_payments
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- 3. Re-derive the parent invoice's payment state from the ledger.
create or replace function public.recalc_invoice_payment_state()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  inv_id       uuid := coalesce(NEW.invoice_id, OLD.invoice_id);
  paid         numeric(12,2);
  last_at      date;
  last_method  text;
  inv_total    numeric(12,2);
  inv_status   text;
begin
  select coalesce(sum(amount),0), max(paid_at)
    into paid, last_at
    from public.invoice_payments where invoice_id = inv_id;

  select method into last_method
    from public.invoice_payments
   where invoice_id = inv_id
   order by paid_at desc, created_at desc
   limit 1;

  select total, status into inv_total, inv_status
    from public.invoices where id = inv_id;

  -- Never reclassify a draft or voided invoice from the ledger.
  if inv_status in ('draft','void') then
    return null;
  end if;

  update public.invoices
     set paid_amount = case when paid > 0 then paid else null end,
         paid_at     = case when paid > 0 then last_at::timestamptz else null end,
         paid_method = case when paid > 0 then last_method else null end,
         status      = case
                         when paid >= inv_total and inv_total > 0 then 'paid'
                         when paid > 0 then 'partial'
                         else 'sent'  -- effectiveStatus() re-derives 'overdue' on read
                       end
   where id = inv_id;

  return null;  -- AFTER trigger
end;
$$;

drop trigger if exists trg_recalc_invoice_payment_state on public.invoice_payments;
create trigger trg_recalc_invoice_payment_state
  after insert or update or delete on public.invoice_payments
  for each row execute function public.recalc_invoice_payment_state();

-- 4. Backfill a payment row for every already-paid invoice so history + the
--    derived state stay consistent (fires the trigger, which re-derives).
--    Marked-paid invoices are treated as paid in full (amount = total).
insert into public.invoice_payments (workspace_id, invoice_id, amount, method, paid_at, source)
select workspace_id, id,
       case when status = 'paid' then total else paid_amount end,
       coalesce(paid_method, 'Unknown'),
       coalesce(paid_at::date, issue_date),
       'backfill'
from public.invoices
where status = 'paid' or coalesce(paid_amount,0) > 0;
