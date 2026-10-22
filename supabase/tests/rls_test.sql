begin;
select plan(17);

-- Fixtures (run as the migration owner, bypassing RLS).
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'admin@t.test'),
  ('a0000000-0000-0000-0000-000000000002', 'agent@t.test'),
  ('a0000000-0000-0000-0000-000000000003', 'viewer@t.test'),
  ('a0000000-0000-0000-0000-000000000004', 'gone@t.test');
update public.staff set role = 'admin' where email = 'admin@t.test';
update public.staff set role = 'agent' where email = 'agent@t.test';
update public.staff set role = 'agent', active = false where email = 'gone@t.test';
-- Isolate from seed.sql: its staff would otherwise count as other admins.
update public.staff set active = false where email not like '%@t.test';
insert into public.clients (id, name, slug) values
  ('c0000000-0000-0000-0000-000000000001', 'Acme', 'acme'),
  ('c0000000-0000-0000-0000-000000000002', 'Other', 'other');
insert into public.products (id, name, slug, kind, owner_client_id) values
  ('d0000000-0000-0000-0000-000000000001', 'Acme Portal', 'acme-portal', 'bespoke', 'c0000000-0000-0000-0000-000000000001');

select is((select role::text from public.staff where email = 'viewer@t.test'), 'viewer',
  'new auth users become viewer staff');

create function pg_temp.as_user(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

-- anon sees nothing
set local role anon;
select throws_ok('select count(*) from public.clients', '42501', null, 'anon cannot read clients');
reset role;

-- viewer: read-only
set local role authenticated;
select pg_temp.as_user('a0000000-0000-0000-0000-000000000003');
select is((select count(*)::int from public.clients where slug in ('acme', 'other')), 2, 'viewer reads clients');
select throws_ok($$insert into public.clients (name, slug) values ('X', 'x')$$, '42501', null, 'viewer cannot create clients');
select throws_ok($$insert into public.client_contacts (client_id, full_name, email) values ('c0000000-0000-0000-0000-000000000001', 'A', 'a@acme.test')$$,
  '42501', null, 'viewer cannot add contacts');

-- agent: contacts yes, clients no
select pg_temp.as_user('a0000000-0000-0000-0000-000000000002');
select lives_ok($$insert into public.client_contacts (client_id, full_name, email) values ('c0000000-0000-0000-0000-000000000001', 'A', 'a@acme.test')$$,
  'agent adds contacts');
select throws_ok($$insert into public.client_domains (client_id, domain) values ('c0000000-0000-0000-0000-000000000001', 'acme.test')$$,
  '42501', null, 'agent cannot add domains');
update public.clients set name = 'Hacked' where slug = 'acme';
select is((select name from public.clients where slug = 'acme'), 'Acme', 'agent update to clients is a no-op');
update public.staff set role = 'admin' where email = 'agent@t.test';
select is((select role::text from public.staff where email = 'agent@t.test'), 'agent', 'agent cannot promote self');

-- deactivated staff: nothing
select pg_temp.as_user('a0000000-0000-0000-0000-000000000004');
select is((select count(*)::int from public.clients), 0, 'deactivated staff read nothing');

-- admin: full write
select pg_temp.as_user('a0000000-0000-0000-0000-000000000001');
select lives_ok($$insert into public.client_domains (client_id, domain) values ('c0000000-0000-0000-0000-000000000001', 'acme.test')$$,
  'admin adds domains');
select throws_ok($$insert into public.client_domains (client_id, domain) values ('c0000000-0000-0000-0000-000000000002', 'acme.test')$$,
  '23505', null, 'a domain maps to one client only');
select throws_ok($$insert into public.client_products (client_id, product_id) values ('c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001')$$,
  '23514', null, 'bespoke product cannot be deployed to another client');
select lives_ok($$insert into public.client_products (client_id, product_id) values ('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001')$$,
  'bespoke product deploys to its owner');
select lives_ok($$update public.staff set role = 'admin' where email = 'viewer@t.test'$$, 'admin promotes staff');
select throws_ok($$update public.staff set email = 'x@t.test' where email = 'viewer@t.test'$$, '42501', null, 'staff email is not editable');
update public.staff set role = 'viewer' where email = 'viewer@t.test';
select throws_ok($$update public.staff set role = 'viewer' where email = 'admin@t.test'$$, '23514', null, 'cannot demote the last active admin');

select * from finish();
rollback;
