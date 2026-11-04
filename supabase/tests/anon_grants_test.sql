begin;
select plan(1);

-- anon reaches only public help center content directly. Default privileges
-- differ between Supabase versions, so every other table must revoke them.
select is(
  (select coalesce(array_agg(c.relname::text order by c.relname), '{}')
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relkind in ('r', 'v', 'm')
     and has_table_privilege('anon', c.oid, 'select, insert, update, delete')),
  array['kb_articles']::text[],
  'anon has table-wide access only to kb_articles'
);

select * from finish();
rollback;
