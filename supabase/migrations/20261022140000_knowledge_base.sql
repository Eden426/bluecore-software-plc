-- Phase 4: the public help center's content (KB articles, FAQs, product docs,
-- product updates) and the staff CMS that edits it.

create type public.kb_type as enum ('article', 'faq', 'doc', 'update');
create type public.kb_status as enum ('draft', 'published', 'archived');
-- internal: staff-only knowledge (runbooks, bespoke-client docs).
create type public.kb_visibility as enum ('public', 'internal');

-- array_to_string() is only STABLE, which generated columns reject; for a
-- text[] it's deterministic, so wrap it as IMMUTABLE for the search column.
create function public.kb_tags_text(tags text[])
returns text
language sql
immutable
set search_path = ''
as $$ select array_to_string(tags, ' ') $$;

create table public.kb_articles (
  id uuid primary key default gen_random_uuid(),
  type public.kb_type not null default 'article',
  title text not null check (length(trim(title)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  summary text not null default '',
  -- Markdown. Rendered without raw HTML support in the app.
  body text not null default '',
  -- Free-form grouping within a type, e.g. "Getting started", "Billing".
  category text not null default '',
  product_id uuid references public.products (id) on delete set null,
  tags text[] not null default '{}',
  status public.kb_status not null default 'draft',
  visibility public.kb_visibility not null default 'public',
  -- Ordering within a category (lower first); FAQs and docs use it.
  position integer not null default 0,
  author_id uuid references public.staff (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('english'::regconfig, title), 'A') ||
    setweight(to_tsvector('english'::regconfig, summary), 'B') ||
    setweight(to_tsvector('english'::regconfig, public.kb_tags_text(tags)), 'B') ||
    setweight(to_tsvector('english'::regconfig, body), 'C')
  ) stored
);
create index kb_articles_search_idx on public.kb_articles using gin (search);
create index kb_articles_listing_idx on public.kb_articles (type, status, visibility);
create index kb_articles_product_idx on public.kb_articles (product_id);

-- Anonymous "was this helpful?" votes. Write-only for the public.
create table public.kb_feedback (
  id bigint generated always as identity primary key,
  article_id uuid not null references public.kb_articles (id) on delete cascade,
  helpful boolean not null,
  created_at timestamptz not null default now()
);
create index kb_feedback_article_idx on public.kb_feedback (article_id);

create function public.kb_articles_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  -- First publish stamps the date; republishing keeps it (updates are dated).
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger kb_articles_before_write before insert or update on public.kb_articles
  for each row execute function public.kb_articles_before_write();

-- Ranked full-text search. Security invoker, so RLS decides what each caller
-- can find at most; by default only published public content is returned even
-- for staff, so the public help center never shows drafts or internal notes to
-- a signed-in agent. Staff tools pass include_internal => true.
create function public.search_kb(
  query text,
  kinds public.kb_type[] default null,
  max_results integer default 20,
  include_internal boolean default false
)
returns table (id uuid, type public.kb_type, title text, slug text, summary text, snippet text, rank real)
language sql
stable
set search_path = ''
as $$
  select a.id, a.type, a.title, a.slug, a.summary,
         ts_headline('english', a.summary || ' ' || a.body, q,
           'StartSel=<<, StopSel=>>, MaxWords=30, MinWords=12, MaxFragments=1') as snippet,
         ts_rank(a.search, q) as rank
  from public.kb_articles a,
       websearch_to_tsquery('english', query) q
  where a.search @@ q
    and (kinds is null or a.type = any (kinds))
    and (include_internal or (a.status = 'published' and a.visibility = 'public'))
  order by rank desc, a.published_at desc nulls last
  limit least(greatest(max_results, 1), 50);
$$;

-- Helpful/not-helpful totals for the CMS.
create view public.kb_feedback_totals with (security_invoker = true) as
  select article_id,
         count(*) filter (where helpful) as helpful,
         count(*) filter (where not helpful) as not_helpful
  from public.kb_feedback
  group by article_id;

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------

alter table public.kb_articles enable row level security;
alter table public.kb_feedback enable row level security;

grant select on public.kb_articles to anon, authenticated;
grant insert, update, delete on public.kb_articles to authenticated;
grant insert (article_id, helpful) on public.kb_feedback to anon, authenticated;
grant select on public.kb_feedback, public.kb_feedback_totals to authenticated;
grant select, insert, update, delete on public.kb_articles, public.kb_feedback to service_role;
grant select on public.kb_feedback_totals to service_role;
grant execute on function public.search_kb(text, public.kb_type[], integer, boolean) to anon, authenticated, service_role;

-- Visitors see published public content; staff see everything.
create policy "public reads published articles" on public.kb_articles
  for select to anon, authenticated
  using (status = 'published' and visibility = 'public');
create policy "staff read all articles" on public.kb_articles
  for select to authenticated using (public.has_role('viewer'));
create policy "agents write articles" on public.kb_articles
  for insert to authenticated with check (public.has_role('agent'));
create policy "agents update articles" on public.kb_articles
  for update to authenticated using (public.has_role('agent')) with check (public.has_role('agent'));
create policy "admins delete articles" on public.kb_articles
  for delete to authenticated using (public.has_role('admin'));

-- Votes only count against content the voter can actually see.
create policy "anyone votes on visible articles" on public.kb_feedback
  for insert to anon, authenticated
  with check (exists (
    select 1 from public.kb_articles a
    where a.id = article_id and a.status = 'published' and a.visibility = 'public'
  ));
create policy "staff read feedback" on public.kb_feedback
  for select to authenticated using (public.has_role('viewer'));

-- The help center lists shared products by name for product docs. Bespoke
-- products stay private (their names identify clients).
grant select (id, name, slug, description, kind, active) on public.products to anon;
create policy "public reads shared products" on public.products
  for select to anon using (kind = 'shared' and active);
