-- 0044_invoice_settled_immutable.sql
--
-- Accounting integrity: once an invoice is settled (paid) or voided, its
-- monetary fields are frozen. The app UI already hides Edit for paid/void,
-- and saveEdit now writes an audit-log entry for every edit — but nothing
-- enforced immutability at the DB, so any workspace member could UPDATE a
-- paid invoice's total/subtotal/tax directly via the Supabase client and
-- silently rewrite settled books.
--
-- This BEFORE UPDATE trigger rejects any change to the money columns
-- (subtotal, tax_rate, tax_amount, total) while the row IS paid/void.
-- Status transitions are deliberately still allowed — reopen (paid->sent),
-- void, and the Stripe charge.refunded/dispute path (paid->sent) only touch
-- `status`/`paid_*`, never the money columns — so legitimate flows keep
-- working. The proper way to change a settled invoice's amount remains
-- void-and-reissue.
--
-- Applied to the live DB alongside this commit.

create or replace function public.forbid_settled_invoice_money_change()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if OLD.status in ('paid', 'void') then
    if NEW.subtotal   is distinct from OLD.subtotal
    or NEW.tax_rate   is distinct from OLD.tax_rate
    or NEW.tax_amount is distinct from OLD.tax_amount
    or NEW.total      is distinct from OLD.total then
      raise exception
        'Invoice % is %; its amounts are frozen. Void and reissue instead of editing.',
        OLD.invoice_number, OLD.status
        using errcode = 'check_violation';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_forbid_settled_invoice_money_change on public.invoices;
create trigger trg_forbid_settled_invoice_money_change
  before update on public.invoices
  for each row
  execute function public.forbid_settled_invoice_money_change();
