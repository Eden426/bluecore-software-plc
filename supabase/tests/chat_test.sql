begin;
select plan(20);

insert into auth.users (id, email) values
  ('c1000000-0000-0000-0000-000000000001', 'agent@chat.test'),
  ('c1000000-0000-0000-0000-000000000002', 'viewer@chat.test');
update public.staff set role = 'agent' where email = 'agent@chat.test';
insert into public.clients (id, name, slug) values ('c2000000-0000-0000-0000-000000000001', 'Chat Co', 'chat-co');
insert into public.client_domains (client_id, domain) values ('c2000000-0000-0000-0000-000000000001', 'chatco.test');

create function pg_temp.as_user(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

-- Visitor side (run as the migration owner, i.e. like the service role)
create temp table s as select public.chat_visitor_start(repeat('a', 64), 'Hana', 'Hana@ChatCo.test',
  E'Our app shows error 500 on login\nsince this morning', 'https://support.blue-core.tech/kb') as r;
grant select on s to authenticated;
create temp table conv as select * from public.chat_conversations where id = (select (r ->> 'conversation_id')::uuid from s);
grant select on conv to authenticated;

select is((select status::text from conv), 'waiting', 'new chats wait for an agent');
select is((select client_id from conv), 'c2000000-0000-0000-0000-000000000001'::uuid, 'visitor is matched to a client by email');
select is((select r ->> 'channel_key' from s), (select channel_key from conv), 'start returns the broadcast channel key');
select is((select jsonb_array_length(public.chat_visitor_messages(repeat('a', 64)) -> 'messages')), 1,
  'visitor can read their conversation by token');
select throws_ok($$select public.chat_visitor_messages(repeat('b', 64))$$, 'P0002', null, 'an unknown token finds nothing');
select lives_ok($$select public.chat_visitor_send(repeat('a', 64), 'Any update?')$$, 'visitor can send');
select throws_ok($$select public.chat_visitor_start('not-a-hash', 'X', 'x@y.test', 'hi')$$, '23514', null,
  'token hashes must be sha-256 hex');

-- Nobody but the service role can use the visitor functions or see raw tables anonymously
set local role anon;
select throws_ok($$select public.chat_visitor_messages(repeat('a', 64))$$, '42501', null, 'anon cannot call visitor functions');
select throws_ok($$select count(*) from public.chat_messages$$, '42501', null, 'anon cannot read chat tables');
reset role;

-- Staff
set local role authenticated;
select pg_temp.as_user('c1000000-0000-0000-0000-000000000002');
select is((select count(*)::int from public.chat_messages where conversation_id = (select id from conv)), 2, 'viewers read chats');
select throws_ok($$insert into public.chat_messages (conversation_id, sender, author_staff_id, author_name, body)
  values ((select id from conv), 'agent', 'c1000000-0000-0000-0000-000000000002', 'V', 'hi')$$, '42501', null, 'viewers cannot reply');

select pg_temp.as_user('c1000000-0000-0000-0000-000000000001');
select throws_ok($$insert into public.chat_messages (conversation_id, sender, author_staff_id, author_name, body)
  values ((select id from conv), 'visitor', 'c1000000-0000-0000-0000-000000000001', 'Hana', 'spoof')$$, '42501', null,
  'agents cannot post as the visitor');
select lives_ok($$insert into public.chat_messages (conversation_id, sender, author_staff_id, author_name, body)
  values ((select id from conv), 'agent', 'c1000000-0000-0000-0000-000000000001', 'Agent Smith', 'Looking now.')$$, 'agents reply');
select is((select status::text || ':' || assignee_id::text from public.chat_conversations where id = (select id from conv)),
  'active:c1000000-0000-0000-0000-000000000001', 'first agent reply activates and claims the chat');

-- Convert to ticket
create temp table t as select * from public.convert_chat_to_ticket((select id from conv));
select is((select subject || '|' || channel::text || '|' || requester_email from t),
  'Our app shows error 500 on login|chat|hana@chatco.test', 'conversion creates a chat ticket from the first line');
select is((select array_agg(kind::text order by created_at)::text from public.ticket_messages where ticket_id = (select id from t)),
  '{customer,customer,note}', 'transcript is copied (agent lines as notes)');
select ok((select first_responded_at is not null and status = 'open' from public.tickets where id = (select id from t)),
  'live agent replies count as the first response');
select is((select (public.convert_chat_to_ticket((select id from conv))).id), (select id from t), 'converting twice returns the same ticket');
reset role;
select is((select public.chat_visitor_messages(repeat('a', 64)) -> 'messages' -> 2 ->> 'author_name'), 'Agent',
  'visitors see agents by first name only');
update public.chat_conversations set status = 'closed' where id = (select id from conv);
select throws_ok($$select public.chat_visitor_send(repeat('a', 64), 'hello?')$$, '23514', null,
  'visitors cannot write to closed chats');

select * from finish();
rollback;
