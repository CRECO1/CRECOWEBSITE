-- 0047_invoice_credits.sql
--
-- Credit notes / adjustments. A credit reduces what a client owes on an
-- invoice (overbilling correction, goodwill credit, partial fee refund).
-- Modeled as an invoice_credits ledger, symmetric with invoice_payments.
-- The recalc trigger now SETTLES an invoice from payments + credits:
--   balance due = total − paid − credited
-- and the invoice is 'paid' once fully settled by any mix of cash + credit.

alter table public.invoices
  add column if not exists credited_amount numeric(12,2);

create table if not exists public.invoice_credits (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invoice_id   uuid not null references public.invoices(id) on delete cascade,
  amount       numeric(12,2) not null check (amount > 0),
  reason       text,
  issued_at    date not null default current_date,
  created_at   timestamptz not null default now(),
  created_by   text
);
create index if not exists invoice_credits_invoice_idx   on public.invoice_credits (invoice_id);
create index if not exists invoice_credits_workspace_idx on public.invoice_credits (workspace_id);

alter table public.invoice_credits enable row level security;
drop policy if exists invoice_credits_rw on public.invoice_credits;
create policy invoice_credits_rw on public.invoice_credits
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- Refactor the recalc so it settles from BOTH payments and credits. This
-- CREATE OR REPLACE preserves existing payments behaviour (when there are
-- no credits, credited = 0 and settled = paid, exactly as before).
create or replace function public.recalc_invoice_payment_state()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  inv_id      uuid := coalesce(NEW.invoice_id, OLD.invoice_id);
  paid        numeric(12,2);
  credited    numeric(12,2);
  settled     numeric(12,2);
  last_at     date;
  last_method text;
  inv_total   numeric(12,2);
  inv_status  text;
begin
  select coalesce(sum(amount),0), max(paid_at) into paid, last_at
    from public.invoice_payments where invoice_id = inv_id;
  select method into last_method
    from public.invoice_payments where invoice_id = inv_id
    order by paid_at desc, created_at desc limit 1;
  select coalesce(sum(amount),0) into credited
    from public.invoice_credits where invoice_id = inv_id;

  select total, status into inv_total, inv_status
    from public.invoices where id = inv_id;
  if inv_status in ('draft','void') then
    return null;
  end if;

  settled := paid + credited;
  update public.invoices
     set paid_amount     = case when paid > 0 then paid else null end,
         credited_amount = case when credited > 0 then credited else null end,
         paid_at         = case when paid > 0 then last_at::timestamptz else null end,
         paid_method     = case when paid > 0 then last_method else null end,
         status          = case
                             when settled >= inv_total and inv_total > 0 then 'paid'
                             when settled > 0 then 'partial'
                             else 'sent'
                           end
   where id = inv_id;
  return null;
end;
$$;

drop trigger if exists trg_recalc_invoice_credits on public.invoice_credits;
create trigger trg_recalc_invoice_credits
  after insert or update or delete on public.invoice_credits
  for each row execute function public.recalc_invoice_payment_state();
