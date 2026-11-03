begin;
select plan(17);

insert into auth.users (id, email) values
  ('f0000000-0000-0000-0000-000000000001', 'agent@kb.test'),
  ('f0000000-0000-0000-0000-000000000002', 'viewer@kb.test');
update public.staff set role = 'agent' where email = 'agent@kb.test';
insert into public.clients (id, name, slug) values ('f1000000-0000-0000-0000-000000000001', 'Kb Client', 'kb-client');
insert into public.products (id, name, slug, kind, owner_client_id) values
  ('f2000000-0000-0000-0000-000000000001', 'Kb Shared', 'kb-shared', 'shared', null),
  ('f2000000-0000-0000-0000-000000000002', 'Kb Secret Portal', 'kb-secret-portal', 'bespoke', 'f1000000-0000-0000-0000-000000000001');

insert into public.kb_articles (id, type, title, slug, summary, body, status, visibility) values
  ('f3000000-0000-0000-0000-000000000001', 'article', 'Resetting your password', 'kbt-reset-password',
   'How to reset a forgotten password', 'Open the login page and choose Forgot password.', 'published', 'public'),
  ('f3000000-0000-0000-0000-000000000002', 'article', 'Password policy draft', 'kbt-password-draft',
   'Unreleased', 'Password rules we have not announced.', 'draft', 'public'),
  ('f3000000-0000-0000-0000-000000000003', 'doc', 'Rotating the portal database password', 'kbt-internal-runbook',
   'Internal runbook', 'Steps for staff only: password rotation.', 'published', 'internal');

create function pg_temp.as_user(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

select isnt((select published_at from public.kb_articles where slug = 'kbt-reset-password'), null,
  'publishing stamps published_at');
select is((select published_at from public.kb_articles where slug = 'kbt-password-draft'), null,
  'drafts have no published_at');

-- Public visitor
set local role anon;
select is((select count(*)::int from public.kb_articles where slug like 'kbt-%'), 1,
  'anon sees only published public articles');
select is((select array_agg(slug)::text from public.search_kb('password') where slug like 'kbt-%'),
  '{kbt-reset-password}', 'anon search never returns drafts or internal articles');
select ok((select snippet from public.search_kb('forgot password') where slug = 'kbt-reset-password') like '%<<%>>%',
  'search returns highlighted snippets');
select is((select array_agg(slug order by slug)::text from public.products where slug like 'kb-%'), '{kb-shared}',
  'anon sees shared products but not bespoke ones');
select throws_ok($$select owner_client_id from public.products$$, '42501', null,
  'anon cannot read product ownership');
select lives_ok($$insert into public.kb_feedback (article_id, helpful) values ('f3000000-0000-0000-0000-000000000001', true)$$,
  'anon can vote on a published article');
select throws_ok($$insert into public.kb_feedback (article_id, helpful) values ('f3000000-0000-0000-0000-000000000003', true)$$,
  '42501', null, 'anon cannot vote on internal articles');
select throws_ok($$select count(*) from public.kb_feedback$$, '42501', null, 'anon cannot read votes');
select throws_ok($$insert into public.kb_articles (title, slug) values ('x', 'kbt-x')$$, '42501', null,
  'anon cannot write articles');
reset role;

-- Staff
set local role authenticated;
select pg_temp.as_user('f0000000-0000-0000-0000-000000000002');
select is((select count(*)::int from public.search_kb('password') where slug like 'kbt-%'), 1,
  'default search is public-only, even for staff');
select is((select count(*)::int from public.search_kb('password', include_internal => true) where slug like 'kbt-%'), 3,
  'staff can opt in to drafts and internal articles');
select throws_ok($$insert into public.kb_articles (title, slug) values ('x', 'kbt-x')$$, '42501', null,
  'viewers cannot write articles');
select pg_temp.as_user('f0000000-0000-0000-0000-000000000001');
select lives_ok($$update public.kb_articles set status = 'published' where slug = 'kbt-password-draft'$$,
  'agents publish articles');
select is((select (helpful, not_helpful)::text from public.kb_feedback_totals
  where article_id = 'f3000000-0000-0000-0000-000000000001'), '(1,0)', 'staff see vote totals');
delete from public.kb_articles where slug = 'kbt-reset-password';
reset role;
select is((select count(*)::int from public.kb_articles where slug = 'kbt-reset-password'), 1,
  'agents cannot delete articles');

select * from finish();
rollback;
