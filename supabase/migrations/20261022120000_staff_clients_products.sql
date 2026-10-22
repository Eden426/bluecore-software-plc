-- Phase 2: staff accounts, client organisations and the product catalog.
--
-- Access model: only Bluecore staff ever authenticate (public sign-up is
-- disabled in config.toml; admins create users from the Supabase dashboard).
-- Every new auth user gets a `staff` row as a `viewer`; an admin promotes them.
--   viewer: read everything
--   agent:  + manage client contacts
--   admin:  + manage clients, domains, products, deployments and staff roles

-- Enum order matters: `>=` comparisons in has_role() rely on it.
create type public.staff_role as enum ('viewer', 'agent', 'admin');
create type public.sla_tier as enum ('standard', 'priority', 'enterprise');
create type public.product_kind as enum ('shared', 'bespoke');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.staff (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role public.staff_role not null default 'viewer',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sla_tier public.sla_tier not null default 'standard',
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Email domains used to match inbound email / chat visitors to a client.
-- A domain can belong to at most one client.
create table public.client_domains (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  domain text not null unique
    check (domain = lower(domain) and domain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'),
  created_at timestamptz not null default now()
);
create index client_domains_client_id_idx on public.client_domains (client_id);

create table public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  full_name text not null check (length(trim(full_name)) > 0),
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text not null default '',
  job_title text not null default '',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index client_contacts_client_email_key on public.client_contacts (client_id, lower(email));

-- Shared products are offered to many clients; bespoke products are built for
-- exactly one (owner_client_id).
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind public.product_kind not null default 'shared',
  owner_client_id uuid references public.clients (id) on delete restrict,
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_bespoke_owner check ((kind = 'bespoke') = (owner_client_id is not null))
);
create index products_owner_client_id_idx on public.products (owner_client_id);

-- Which client runs which product, per environment.
create table public.client_products (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  environment text not null default 'production' check (length(trim(environment)) > 0),
  url text not null default '',
  version text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, product_id, environment)
);
create index client_products_product_id_idx on public.client_products (product_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger staff_updated_at before update on public.staff
  for each row execute function public.set_updated_at();
create trigger clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
create trigger client_contacts_updated_at before update on public.client_contacts
  for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger client_products_updated_at before update on public.client_products
  for each row execute function public.set_updated_at();

-- Every auth user is staff (sign-up is disabled), starting as a viewer.
create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.staff (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- A bespoke product may only be deployed for the client it was built for.
create function public.check_bespoke_deployment()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  owner uuid;
begin
  select owner_client_id into owner from public.products where id = new.product_id;
  if owner is not null and owner <> new.client_id then
    raise exception 'bespoke product % belongs to another client', new.product_id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger client_products_bespoke_owner before insert or update on public.client_products
  for each row execute function public.check_bespoke_deployment();

-- Keep at least one active admin, so nobody can lock everyone out of role management.
create function public.protect_last_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role = 'admin' and old.active
     and (new.role <> 'admin' or not new.active)
     and not exists (
       select 1 from public.staff
       where role = 'admin' and active and id <> old.id
     ) then
    raise exception 'cannot remove the last active admin'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger staff_protect_last_admin before update on public.staff
  for each row execute function public.protect_last_admin();

-- ---------------------------------------------------------------------------
-- Role helpers (security definer so policies can read staff without recursion)
-- ---------------------------------------------------------------------------

create function public.current_staff_role()
returns public.staff_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.staff where id = (select auth.uid()) and active;
$$;

create function public.has_role(min_role public.staff_role)
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(public.current_staff_role() >= min_role, false);
$$;

revoke execute on function public.current_staff_role() from public, anon;
revoke execute on function public.has_role(public.staff_role) from public, anon;
grant execute on function public.current_staff_role() to authenticated;
grant execute on function public.has_role(public.staff_role) to authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.staff enable row level security;
alter table public.clients enable row level security;
alter table public.client_domains enable row level security;
alter table public.client_contacts enable row level security;
alter table public.products enable row level security;
alter table public.client_products enable row level security;

-- Nothing here is public: no anon access at all.
revoke all on public.staff, public.clients, public.client_domains, public.client_contacts,
  public.products, public.client_products from anon;

-- Table privileges for signed-in users; the policies below decide which rows
-- each role may actually touch. (Newer Supabase projects don't auto-grant.)
grant select on public.staff to authenticated;
grant select, insert, update, delete on public.clients, public.client_domains,
  public.client_contacts, public.products, public.client_products to authenticated;

-- staff: everyone active can see the roster; only admins change roles or
-- deactivate people. Rows are created by the auth trigger and removed by
-- deleting the auth user, so there are no insert/delete policies.
create policy "staff can read staff" on public.staff
  for select to authenticated using (public.has_role('viewer'));
create policy "admins update staff" on public.staff
  for update to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));

-- Only role/active/full_name are editable from the app.
revoke update on public.staff from authenticated;
grant update (role, active, full_name) on public.staff to authenticated;

-- clients, domains, products, deployments: read for all staff, write for admins.
create policy "staff read clients" on public.clients
  for select to authenticated using (public.has_role('viewer'));
create policy "admins write clients" on public.clients
  for all to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "staff read client domains" on public.client_domains
  for select to authenticated using (public.has_role('viewer'));
create policy "admins write client domains" on public.client_domains
  for all to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "staff read products" on public.products
  for select to authenticated using (public.has_role('viewer'));
create policy "admins write products" on public.products
  for all to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "staff read client products" on public.client_products
  for select to authenticated using (public.has_role('viewer'));
create policy "admins write client products" on public.client_products
  for all to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));

-- contacts: agents and admins manage them.
create policy "staff read client contacts" on public.client_contacts
  for select to authenticated using (public.has_role('viewer'));
create policy "agents write client contacts" on public.client_contacts
  for all to authenticated
  using (public.has_role('agent')) with check (public.has_role('agent'));
