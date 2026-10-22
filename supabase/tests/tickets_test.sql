begin;
select plan(29);

-- Fixtures (run as the migration owner, bypassing RLS).
insert into auth.users (id, email) values
  ('b0000000-0000-0000-0000-000000000001', 'agent@tk.test'),
  ('b0000000-0000-0000-0000-000000000002', 'viewer@tk.test');
update public.staff set role = 'agent' where email = 'agent@tk.test';
insert into public.clients (id, name, slug, sla_tier) values
  ('e0000000-0000-0000-0000-000000000001', 'Tk Corp', 'tk-corp', 'enterprise'),
  ('e0000000-0000-0000-0000-000000000002', 'Elsewhere', 'elsewhere', 'standard');
insert into public.client_domains (client_id, domain) values
  ('e0000000-0000-0000-0000-000000000001', 'tkcorp.test'),
  ('e0000000-0000-0000-0000-000000000002', 'elsewhere.test');

create function pg_temp.as_user(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

-- Client matching
select is(public.match_client_by_email('Sara@TKCORP.test'), 'e0000000-0000-0000-0000-000000000001'::uuid,
  'matches client by domain, case-insensitively');
select is(public.match_client_by_email('ops@mail.tkcorp.test'), 'e0000000-0000-0000-0000-000000000001'::uuid,
  'matches client by parent domain');
select is(public.match_client_by_email('someone@gmail.test'), null, 'unknown domains match no client');

-- Inbound email creates a ticket
create temp table r1 as select public.ingest_inbound_email(jsonb_build_object(
  'resend_email_id', 're_1', 'from_email', 'Sara@tkcorp.test', 'from_name', 'Sara',
  'to', jsonb_build_array('support@blue-core.tech'), 'subject', 'Re: Fwd: Printer is down',
  'text', 'It stopped printing.', 'message_id', '<m1@tkcorp.test>')) as r;
select is((select (r ->> 'created')::boolean from r1), true, 'first email creates a ticket');
create temp table t1 as select * from public.tickets where id = (select (r ->> 'ticket_id')::uuid from r1);
-- Fixture lookups run under the authenticated role below.
grant select on t1 to authenticated;
select is((select subject from t1), 'Printer is down', 'Re:/Fwd: prefixes are stripped');
select is((select client_id from t1), 'e0000000-0000-0000-0000-000000000001'::uuid, 'ticket is linked to the sender''s client');
select is((select requester_email from t1), 'sara@tkcorp.test', 'requester email is lowercased');
select is((select channel::text from t1), 'email', 'channel is email');
select is((select first_response_due_at - created_at from t1), interval '4 hours',
  'enterprise/normal SLA gives a 4h first-response target');
select is((select count(*)::int from public.ticket_messages where ticket_id = (select id from t1) and kind = 'customer'), 1,
  'the email body is stored as a customer message');

-- Retries are idempotent
select is((select (public.ingest_inbound_email(jsonb_build_object(
  'resend_email_id', 're_1', 'from_email', 'sara@tkcorp.test', 'subject', 'Printer is down')) ->> 'duplicate')::boolean),
  true, 'replayed webhook is a no-op');
select is((select count(*)::int from public.ticket_messages where ticket_id = (select id from t1)), 1, 'no duplicate message');

-- Threading by reply token, subject reference, and In-Reply-To
select is((select (public.ingest_inbound_email(jsonb_build_object(
  'resend_email_id', 're_2', 'from_email', 'sara@tkcorp.test', 'subject', 'anything',
  'to', jsonb_build_array('support+' || (select reply_token from t1) || '@blue-core.tech'))) ->> 'ticket_id')::uuid),
  (select id from t1), 'reply-address token threads onto the ticket');
select is((select (public.ingest_inbound_email(jsonb_build_object(
  'resend_email_id', 're_3', 'from_email', 'boss@tkcorp.test',
  'subject', 'Re: [BC-' || (select number from t1) || '] Printer is down')) ->> 'ticket_id')::uuid),
  (select id from t1), 'subject reference threads for a colleague at the same client');
select is((select (public.ingest_inbound_email(jsonb_build_object(
  'resend_email_id', 're_4', 'from_email', 'sara@tkcorp.test', 'subject', 'no ref',
  'in_reply_to', '<m1@tkcorp.test>')) ->> 'ticket_id')::uuid),
  (select id from t1), 'In-Reply-To threads onto the ticket');
select is((select (public.ingest_inbound_email(jsonb_build_object(
  'resend_email_id', 're_5', 'from_email', 'mallory@elsewhere.test',
  'subject', 'Re: [BC-' || (select number from t1) || '] Printer is down')) ->> 'created')::boolean),
  true, 'an outsider guessing the ticket number gets a new ticket instead');

-- RLS: viewer reads but cannot write
set local role authenticated;
select pg_temp.as_user('b0000000-0000-0000-0000-000000000002');
select ok((select count(*) from public.tickets) >= 2, 'viewer reads tickets');
select throws_ok($$insert into public.ticket_messages (ticket_id, kind, author_staff_id, body_text)
  values ((select id from t1), 'note', 'b0000000-0000-0000-0000-000000000002', 'hi')$$,
  '42501', null, 'viewer cannot post notes');
select throws_ok($$select public.ingest_inbound_email('{}'::jsonb)$$, '42501', null,
  'staff cannot call the ingestion function directly');
select throws_ok($$select public.create_staff_ticket('x', 'a@b.test', '', '')$$, '42501', null,
  'viewers cannot log tickets');

-- Agent replies
select pg_temp.as_user('b0000000-0000-0000-0000-000000000001');
select throws_ok($$insert into public.ticket_messages (ticket_id, kind, author_staff_id, body_text)
  values ((select id from t1), 'customer', 'b0000000-0000-0000-0000-000000000001', 'spoof')$$,
  '42501', null, 'agents cannot post as the customer');
select throws_ok($$insert into public.ticket_messages (ticket_id, kind, author_staff_id, body_text)
  values ((select id from t1), 'agent', 'b0000000-0000-0000-0000-000000000002', 'impersonate')$$,
  '42501', null, 'agents cannot post as another staff member');
select lives_ok($$insert into public.ticket_messages (ticket_id, kind, author_staff_id, body_text)
  values ((select id from t1), 'agent', 'b0000000-0000-0000-0000-000000000001', 'On it.')$$, 'agent replies');
select is((select (public.create_staff_ticket('Phone: login fails', 'Dawit@Elsewhere.test', 'Dawit', 'Cannot log in since update.')).client_id),
  'e0000000-0000-0000-0000-000000000002'::uuid, 'agent logs a phone ticket, matched to the caller''s client');
select is((select kind::text || ':' || body_text from public.ticket_messages m join public.tickets t on t.id = m.ticket_id
  where t.subject = 'Phone: login fails'), 'customer:Cannot log in since update.', 'description is stored as the customer''s message');
reset role;
select is((select status::text from public.tickets where id = (select id from t1)), 'open', 'first reply opens a new ticket');
select isnt((select first_responded_at from public.tickets where id = (select id from t1)), null, 'first response is recorded');

set local role authenticated;
select pg_temp.as_user('b0000000-0000-0000-0000-000000000001');
update public.tickets set status = 'solved', assignee_id = 'b0000000-0000-0000-0000-000000000001' where id = (select id from t1);
reset role;
select is((select array_agg(event order by id)::text from public.ticket_events where ticket_id = (select id from t1)),
  '{created,status,status,assignee}', 'changes are audited with the acting agent');

-- A customer reply reopens a solved ticket
select public.ingest_inbound_email(jsonb_build_object(
  'resend_email_id', 're_6', 'from_email', 'sara@tkcorp.test',
  'subject', 'Re: [BC-' || (select number from t1) || '] Printer is down', 'text', 'Still broken'));
select is((select status::text from public.tickets where id = (select id from t1)), 'open', 'customer reply reopens a solved ticket');

select * from finish();
rollback;
