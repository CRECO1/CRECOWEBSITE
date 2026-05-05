-- ============================================================================
-- CRECO – Index leads.assigned_agent_id
--
-- The foreign key from leads → agents has no supporting index, which makes
-- "leads assigned to agent X" filters and cascading deletes do sequential
-- scans. Tiny impact at current row counts but worth fixing before the table
-- grows past a few hundred leads.
-- ============================================================================

create index if not exists leads_assigned_agent_id_idx
  on public.leads (assigned_agent_id)
  where assigned_agent_id is not null;
