-- 0028_recurring_property_id.sql
--
-- Property tagging on recurring templates. Closes the gap from migration
-- 0027 where invoices + expenses gained property_id but the recurring
-- side didn't — so monthly retainer templates (e.g. "$2K/mo PM fee on
-- 8000 Fair Oaks Pkwy") couldn't auto-stamp the generated invoices
-- with property_id. Result: the property's P&L missed the recurring
-- revenue, even though the operator had set it up correctly.
--
-- With this column in place, the recurring-generate code path can
-- carry property_id from template → invoice on each occurrence. The
-- property_reference text snapshot continues to be denormalized for
-- legacy reports / picker-fallback display.
--
-- ON DELETE SET NULL — deleting a property soft-clears the link but
-- doesn't cascade-delete the template (which has its own lifecycle).

alter table public.recurring_invoice_templates
  add column if not exists property_id uuid
  references public.properties(id) on delete set null;

create index if not exists recurring_templates_property_id_idx
  on public.recurring_invoice_templates(property_id)
  where property_id is not null and active = true;
