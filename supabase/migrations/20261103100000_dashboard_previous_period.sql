-- Adds the preceding period's created and solved counts, so the dashboard can
-- show a trend. Everything else is unchanged.

create or replace function public.support_dashboard(days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  since timestamptz;
  prior_since timestamptz;
  result jsonb;
begin
  if not public.has_role('viewer') then
    raise exception 'permission denied' using errcode = 'insufficient_privilege';
  end if;
  days := least(greatest(coalesce(days, 30), 1), 365);
  since := date_trunc('day', now()) - make_interval(days => days - 1);
  prior_since := since - make_interval(days => days);

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
    'previous', jsonb_build_object(
      'created', (select count(*) from public.tickets where created_at >= prior_since and created_at < since),
      'solved', (select count(*) from public.tickets where solved_at >= prior_since and solved_at < since)
    ),
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
