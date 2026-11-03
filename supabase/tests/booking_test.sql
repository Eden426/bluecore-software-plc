begin;
select plan(18);

insert into auth.users (id, email) values
  ('c1000000-0000-0000-0000-000000000001', 'agent1@bk.test'),
  ('c1000000-0000-0000-0000-000000000002', 'agent2@bk.test'),
  ('c1000000-0000-0000-0000-000000000003', 'viewer@bk.test');
update public.staff set role = 'agent', full_name = 'Sara Bekele' where email = 'agent1@bk.test';
update public.staff set role = 'agent' where email = 'agent2@bk.test';
-- Only the first agent is bookable: London hours, Mon and Fri 09:00-10:00.
insert into public.calendar_connections (staff_id, google_email, refresh_token_enc)
values ('c1000000-0000-0000-0000-000000000001', 'sara@gmail.test', 'enc');
insert into public.booking_agents (staff_id, timezone, accepts_bookings)
values ('c1000000-0000-0000-0000-000000000001', 'Europe/London', true);
insert into public.availability_windows (staff_id, weekday, start_time, end_time) values
  ('c1000000-0000-0000-0000-000000000001', 1, '09:00', '10:00'),
  ('c1000000-0000-0000-0000-000000000001', 5, '09:00', '10:00');

create function pg_temp.as_user(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

-- UK clocks go back on Sunday 2027-10-31.
select is(
  (select array_agg(starts_at order by starts_at)::text from public.booking_candidate_slots('2027-10-29', '2027-11-02') where staff_id = 'c1000000-0000-0000-0000-000000000001'),
  '{"2027-10-29 08:00:00+00","2027-10-29 08:30:00+00","2027-11-01 09:00:00+00","2027-11-01 09:30:00+00"}',
  'slots follow the agent''s wall clock across a DST change');
select is((select count(*)::int from public.booking_candidate_slots(now(), now() + interval '1 hour') where staff_id = 'c1000000-0000-0000-0000-000000000001'), 0,
  'nothing is offered inside the two-hour notice period');

update public.calendar_connections set status = 'broken';
select is((select count(*)::int from public.booking_candidate_slots('2027-10-29', '2027-11-02') where staff_id = 'c1000000-0000-0000-0000-000000000001'), 0,
  'agents with a broken Google connection are not offered');
update public.calendar_connections set status = 'connected';

-- Reserve, confirm, and the slot disappears
create temp table b1 as select * from public.booking_create('c1000000-0000-0000-0000-000000000001', '2027-11-01 09:00Z',
  'Dawit', 'Dawit@Example.test', 'Invoices fail to sync', repeat('a', 64));
grant select on b1 to authenticated;
select is((select status::text from b1), 'pending', 'a booking starts pending');
select is((select requester_email from b1), 'dawit@example.test', 'email is lowercased');
select is((select count(*)::int from public.booking_candidate_slots('2027-11-01', '2027-11-02') where staff_id = 'c1000000-0000-0000-0000-000000000001'), 1,
  'a reserved slot is no longer offered');
select throws_ok($$select public.booking_create('c1000000-0000-0000-0000-000000000001', '2027-11-01 09:00Z',
  'Eve', 'eve@example.test', 'x', repeat('b', 64))$$, '23514', null, 'a taken slot cannot be booked again');
select throws_ok($$select public.booking_create('c1000000-0000-0000-0000-000000000002', '2027-11-01 09:00Z',
  'Eve', 'eve@example.test', 'x', repeat('b', 64))$$, '23514', null, 'agents without hours cannot be booked');
select throws_ok($$insert into public.bookings (staff_id, requester_name, requester_email, topic, starts_at, ends_at, cancel_token_hash)
  values ('c1000000-0000-0000-0000-000000000001', 'R', 'r@x.test', 't', '2027-11-01 09:15Z', '2027-11-01 09:45Z', repeat('c', 64))$$,
  '23P01', null, 'overlapping bookings for one agent are rejected');

select is((select public.booking_confirm((select id from b1), 'evt_1', 'https://meet.google.com/abc') ->> 'agent_name'),
  'Sara', 'confirming returns the agent''s first name');
create temp table t1 as select t.* from public.tickets t join public.bookings b on b.ticket_id = t.id where b.id = (select id from b1);
select is((select channel::text || ':' || subject from t1), 'booking:Call: Invoices fail to sync', 'confirming opens a booking ticket');
select is((select assignee_id from t1), 'c1000000-0000-0000-0000-000000000001'::uuid, 'the ticket is assigned to the agent');

-- Booking links tie a call to an existing ticket
set local role authenticated;
select pg_temp.as_user('c1000000-0000-0000-0000-000000000003');
select throws_ok($$select public.create_ticket_booking_link((select id from b1 limit 0))$$, '42501', null,
  'viewers cannot create booking links');
select is((select count(*)::int from public.bookings where staff_id = 'c1000000-0000-0000-0000-000000000001'), 1, 'staff can read bookings');
select throws_ok($$select public.booking_create('c1000000-0000-0000-0000-000000000001', '2027-11-01 09:30Z',
  'E', 'e@x.test', 'x', repeat('d', 64))$$, '42501', null, 'staff cannot call booking functions directly');
select pg_temp.as_user('c1000000-0000-0000-0000-000000000001');
create temp table link as select public.create_ticket_booking_link((select ticket_id from public.bookings where id = (select id from b1))) as token;
reset role;
select is((public.booking_link_info(encode(extensions.digest((select token from link), 'sha256'), 'hex')) ->> 'name'), 'Dawit',
  'a booking link prefills the requester');

-- Cancelling frees the slot and notes it on the ticket
select public.booking_cancel((select id from b1), 'the customer');
select is((select count(*)::int from public.booking_candidate_slots('2027-11-01', '2027-11-02') where staff_id = 'c1000000-0000-0000-0000-000000000001'), 2,
  'a cancelled slot is offered again');
-- Every row in this transaction shares now(), so match the note rather than
-- picking the newest message.
select ok(exists(select 1 from public.ticket_messages where ticket_id = (select id from t1) and kind = 'system'
  and body_text like '%cancelled by the customer.'), 'cancellation is noted on the ticket');

select * from finish();
rollback;
