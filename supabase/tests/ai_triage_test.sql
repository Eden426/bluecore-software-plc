begin;
select plan(11);

insert into auth.users (id, email) values
  ('d1000000-0000-0000-0000-000000000001', 'agent@ai.test'),
  ('d1000000-0000-0000-0000-000000000002', 'viewer@ai.test');
update public.staff set role = 'agent' where email = 'agent@ai.test';

insert into public.products (id, name, slug, kind) values
  ('d2000000-0000-0000-0000-000000000001', 'Ledger AI', 'ledger-ai-test', 'shared');
insert into public.tickets (id, subject, requester_email, tags)
values ('d3000000-0000-0000-0000-000000000001', 'Invoices fail to sync', 'cust@example.test', '{billing}');
insert into public.ticket_ai_triage (ticket_id, priority, product_id, category, tags, summary, model)
values ('d3000000-0000-0000-0000-000000000001', 'high', 'd2000000-0000-0000-0000-000000000001', 'bug',
  '{sync,billing}', 'Invoice sync fails.', 'test-model');

create function pg_temp.as_user(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;

-- Viewers read suggestions but can't act on them or write the table.
select pg_temp.as_user('d1000000-0000-0000-0000-000000000002');
select is((select summary from public.ticket_ai_triage where ticket_id = 'd3000000-0000-0000-0000-000000000001'),
  'Invoice sync fails.', 'staff can read suggestions');
select throws_ok($$select public.apply_ai_triage('d3000000-0000-0000-0000-000000000001', '{priority}')$$,
  '42501', null, 'viewers cannot apply suggestions');
select throws_ok($$select public.decide_ai_triage('d3000000-0000-0000-0000-000000000001', 'dismissed')$$,
  '42501', null, 'viewers cannot dismiss suggestions');
select throws_ok($$insert into public.ticket_ai_triage (ticket_id, priority, model)
  values ('d3000000-0000-0000-0000-000000000001', 'low', 'x')$$, '42501', null, 'staff cannot write suggestions directly');
select ok((public.support_dashboard(7) ->> 'open')::int >= 1, 'viewers can load the dashboard');

-- Agents apply only the fields they pick.
select pg_temp.as_user('d1000000-0000-0000-0000-000000000001');
select public.apply_ai_triage('d3000000-0000-0000-0000-000000000001', '{priority,tags}');
select is((select priority::text || ':' || array_to_string(tags, ',') || ':' || coalesce(product_id::text, 'none')
  from public.tickets where id = 'd3000000-0000-0000-0000-000000000001'),
  'high:billing,sync:none', 'applying sets the chosen fields, merges tags and leaves the rest');
select is((select status::text || ':' || decided_by::text from public.ticket_ai_triage
  where ticket_id = 'd3000000-0000-0000-0000-000000000001'),
  'applied:d1000000-0000-0000-0000-000000000001', 'the decision is recorded against the agent');
select ok(exists(select 1 from public.ticket_events where ticket_id = 'd3000000-0000-0000-0000-000000000001'
  and event = 'priority' and actor_id = 'd1000000-0000-0000-0000-000000000001'), 'the audit trail credits the agent');
select throws_ok($$select public.apply_ai_triage(gen_random_uuid(), '{priority}')$$, 'P0002', null,
  'applying a missing suggestion fails');

reset role;
select is((public.support_dashboard(7) -> 'ai_triage' ->> 'applied')::int >= 1, true, 'the dashboard counts applied suggestions');

set local role anon;
select throws_ok($$select public.support_dashboard(7)$$, '42501', null, 'the public cannot load the dashboard');

select * from finish();
rollback;
