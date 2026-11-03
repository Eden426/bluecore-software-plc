-- Phase 7: AI triage suggestions on tickets, and the support dashboard.
--
-- The server asks Claude to read a new ticket and stores what it suggests
-- here. Nothing changes on the ticket until an agent applies a suggestion,
-- so a wrong guess costs a click, not a misrouted ticket.

create type public.ai_triage_status as enum ('suggested', 'applied', 'dismissed');

create table public.ticket_ai_triage (
  ticket_id uuid primary key references public.tickets (id) on delete cascade,
  status public.ai_triage_status not null default 'suggested',
  priority public.ticket_priority not null,
  product_id uuid references public.products (id) on delete set null,
  category text not null default '',
  tags text[] not null default '{}',
  summary text not null default '',
  suggested_reply text not null default '',
  reasoning text not null default '',
  model text not null,
  decided_by uuid references public.staff (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.ticket_ai_triage enable row level security;
revoke all on public.ticket_ai_triage from anon;
grant select on public.ticket_ai_triage to authenticated;
grant all on public.ticket_ai_triage to service_role;

create policy "staff read ai triage" on public.ticket_ai_triage
  for select to authenticated using (public.has_role('viewer'));

-- Apply some or all of a suggestion (any of 'priority', 'product', 'tags').
-- Runs as the agent's own ticket update, so the audit trail credits them.
create function public.apply_ai_triage(target uuid, fields text[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  s public.ticket_ai_triage;
begin
  if not public.has_role('agent') then
    raise exception 'permission denied' using errcode = 'insufficient_privilege';
  end if;
  select * into s from public.ticket_ai_triage where ticket_id = target;
  if not found then
    raise exception 'no suggestion' using errcode = 'P0002';
  end if;
  update public.tickets t set
    priority = case when 'priority' = any(fields) then s.priority else t.priority end,
    product_id = case when 'product' = any(fields) and s.product_id is not null then s.product_id else t.product_id end,
    tags = case when 'tags' = any(fields) then
      (select coalesce(array_agg(distinct x order by x), '{}') from unnest(t.tags || s.tags) x) else t.tags end
  where t.id = target;
  perform public.decide_ai_triage(target, 'applied');
end;
$$;

-- Records an agent's decision. Definer, because agents can't write the
-- triage table directly.
create function public.decide_ai_triage(target uuid, decision public.ai_triage_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_role('agent') then
    raise exception 'permission denied' using errcode = 'insufficient_privilege';
  end if;
  update public.ticket_ai_triage
  set status = decision, decided_by = (select auth.uid()), decided_at = now()
  where ticket_id = target;
end;
$$;

revoke execute on function public.apply_ai_triage(uuid, text[]) from public, anon;
grant execute on function public.apply_ai_triage(uuid, text[]) to authenticated;
revoke execute on function public.decide_ai_triage(uuid, public.ai_triage_status) from public, anon;
grant execute on function public.decide_ai_triage(uuid, public.ai_triage_status) to authenticated;

-- ---------------------------------------------------------------------------
-- Dashboard: one call returns everything /admin/dashboard shows, computed
-- over the last `days` days (open-queue figures are always "right now").
-- ---------------------------------------------------------------------------

create function public.support_dashboard(days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  since timestamptz;
  result jsonb;
begin
  if not public.has_role('viewer') then
    raise exception 'permission denied' using errcode = 'insufficient_privilege';
  end if;
  days := least(greatest(coalesce(days, 30), 1), 365);
  since := date_trunc('day', now()) - make_interval(days => days - 1);

  with open_t as (
    select * from public.tickets where status in ('new', 'open', 'pending', 'on_hold')
  ),
  recent as (
    select * from public.tickets where created_at >= since
  )
  select jsonb_build_object(
    'days', days,
    'open', (select count(*) from open_t),
    'unassigned', (select count(*) from open_t where assignee_id is null),
    'first_response_overdue', (select count(*) from open_t
      where first_responded_at is null and first_response_due_at < now()),
    'resolution_overdue', (select count(*) from open_t where resolution_due_at < now()),
    'open_by_status', (select coalesce(jsonb_object_agg(status, n), '{}') from
      (select status, count(*) n from open_t group by status) s),
    'open_by_priority', (select coalesce(jsonb_object_agg(priority, n), '{}') from
      (select priority, count(*) n from open_t group by priority) s),
    'created', (select count(*) from recent),
    'solved', (select count(*) from public.tickets where solved_at >= since),
    'by_channel', (select coalesce(jsonb_object_agg(channel, n), '{}') from
      (select channel, count(*) n from recent group by channel) s),
    'median_first_response_minutes', (select round(extract(epoch from
      percentile_cont(0.5) within group (order by first_responded_at - created_at)) / 60)
      from recent where first_responded_at is not null),
    'first_response_met_pct', (select round(100.0 * count(*) filter (where first_responded_at <= first_response_due_at)
      / nullif(count(*), 0)) from recent where first_responded_at is not null),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'created', c, 'solved', s) order by d), '[]')
      from (
        select d,
          (select count(*) from public.tickets where created_at >= d and created_at < d + interval '1 day') c,
          (select count(*) from public.tickets where solved_at >= d and solved_at < d + interval '1 day') s
        from generate_series(since, date_trunc('day', now()), interval '1 day') d
      ) x),
    'agents', (select coalesce(jsonb_agg(a order by a->>'name'), '[]') from (
      select jsonb_build_object(
        'id', st.id,
        'name', coalesce(nullif(st.full_name, ''), st.email),
        'open', (select count(*) from open_t where assignee_id = st.id),
        'solved', (select count(*) from public.tickets where assignee_id = st.id and solved_at >= since)
      ) a
      from public.staff st where st.active and st.role in ('agent', 'admin')
    ) agents),
    'top_clients', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'tickets', n) order by n desc, c.name), '[]')
      from (select client_id, count(*) n from recent where client_id is not null group by client_id order by n desc limit 5) r
      join public.clients c on c.id = r.client_id),
    'ai_triage', jsonb_build_object(
      'suggested', (select count(*) from public.ticket_ai_triage where created_at >= since),
      'applied', (select count(*) from public.ticket_ai_triage where created_at >= since and status = 'applied'),
      'dismissed', (select count(*) from public.ticket_ai_triage where created_at >= since and status = 'dismissed')
    )
  ) into result;
  return result;
end;
$$;

revoke execute on function public.support_dashboard(integer) from public, anon;
grant execute on function public.support_dashboard(integer) to authenticated;
