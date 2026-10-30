-- Shared rate limiter storage.
--
-- The API routes throttle by client IP. The per-instance in-memory limiter
-- resets on every cold start and does not see traffic handled by other
-- serverless instances, so a determined bot can route around it. This table
-- and function give every instance one shared, atomic counter.
--
-- Apply once in the Supabase SQL editor (or via psql). Safe to re-run.
-- Until it is applied the app keeps using the in-memory limiter, so nothing
-- breaks if this file has not been run yet.

create table if not exists public.rate_limit_hits (
  key        text primary key,
  window_end timestamptz not null,
  hits       integer not null default 0
);

-- Server-only: RLS on with no policies, and no direct grants to client roles.
alter table public.rate_limit_hits enable row level security;
revoke all on public.rate_limit_hits from anon, authenticated;

create index if not exists rate_limit_hits_window_end_idx
  on public.rate_limit_hits (window_end);

-- Atomically count one hit for p_key inside a rolling window of p_window_ms.
-- Returns the hit count for the current window and ms until it resets.
create or replace function public.rl_hit(p_key text, p_window_ms integer)
returns table(hits integer, ttl_ms integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Opportunistic cleanup so the table never grows without bound.
  if random() < 0.02 then
    delete from public.rate_limit_hits where window_end < now() - interval '1 hour';
  end if;

  return query
  insert into public.rate_limit_hits as r (key, window_end, hits)
  values (p_key, now() + make_interval(secs => p_window_ms / 1000.0), 1)
  on conflict (key) do update set
    hits       = case when r.window_end < now() then 1 else r.hits + 1 end,
    window_end = case when r.window_end < now()
                      then now() + make_interval(secs => p_window_ms / 1000.0)
                      else r.window_end end
  returning r.hits,
            greatest(0, (extract(epoch from (r.window_end - now())) * 1000)::integer);
end;
$$;

-- Only the server (service role) may call it. Callable by anon would let
-- anyone burn another visitor's quota.
revoke all on function public.rl_hit(text, integer) from public, anon, authenticated;
grant execute on function public.rl_hit(text, integer) to service_role;
