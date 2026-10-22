-- Phase 6: one-to-one support calls booked from the help center, on agents'
-- own Google Calendars (free/busy for availability, events with Meet links).
--
-- Each agent connects their Google account (apps/support/api/google/*). The
-- refresh token is encrypted by the server and lives in calendar_connections,
-- whose token column only the service role can read. Visitors never touch
-- these tables: apps/support/api/booking/* calls the service-role-only
-- booking_* functions below. A booking is reserved here first (an exclusion
-- constraint stops double-booking), then the Google event is created, then
-- booking_confirm() links it to a ticket.

create extension if not exists btree_gist with schema extensions;

alter type public.ticket_channel add value if not exists 'booking';

create type public.calendar_status as enum ('connected', 'broken');
create type public.booking_status as enum ('pending', 'confirmed', 'cancelled');

create table public.calendar_connections (
  staff_id uuid primary key references public.staff (id) on delete cascade,
  google_email text not null default '',
  -- AES-GCM ciphertext from the server (GOOGLE_TOKEN_KEY); never sent to browsers.
  refresh_token_enc text not null,
  status public.calendar_status not null default 'connected',
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- An agent's bookable hours. Times are wall-clock in `timezone`, so slots
-- follow the agent's daylight-saving changes.
create table public.booking_agents (
  staff_id uuid primary key references public.staff (id) on delete cascade,
  timezone text not null default 'Africa/Addis_Ababa'
    check ('2000-01-01 00:00Z'::timestamptz at time zone timezone is not null),
  accepts_bookings boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.availability_windows (
  id bigint generated always as identity primary key,
  staff_id uuid not null references public.booking_agents (staff_id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7), -- ISO: 1 = Monday
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);
create index availability_windows_staff_idx on public.availability_windows (staff_id);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id),
  ticket_id uuid references public.tickets (id) on delete set null,
  requester_name text not null check (length(trim(requester_name)) between 1 and 120),
  requester_email text not null check (requester_email = lower(requester_email) and requester_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  topic text not null check (length(trim(topic)) between 1 and 2000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  during tstzrange generated always as (tstzrange(starts_at, ends_at)) stored,
  status public.booking_status not null default 'pending',
  google_event_id text,
  meet_url text,
  cancel_token_hash text not null unique check (cancel_token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  check (ends_at > starts_at),
  -- No agent can hold two live bookings that overlap.
  exclude using gist (staff_id with =, during with &&) where (status <> 'cancelled')
);
create index bookings_starts_idx on public.bookings (starts_at);
create index bookings_ticket_idx on public.bookings (ticket_id);

-- Links agents send so a customer can book a call about an existing ticket.
-- Only the SHA-256 of the token is stored (the reply-address token is never
-- put in a URL).
create table public.ticket_booking_links (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  created_by uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

-- ---------------------------------------------------------------------------
-- Slots
-- ---------------------------------------------------------------------------

-- 30-minute slots from every bookable agent's weekly hours in [range_start,
-- range_end), at least two hours ahead, minus their existing bookings. The
-- API then removes times that are busy on the agent's Google Calendar.
create function public.booking_candidate_slots(range_start timestamptz, range_end timestamptz)
returns table (staff_id uuid, starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select a.staff_id, s.slot_start, s.slot_start + interval '30 minutes'
  from public.booking_agents a
  join public.staff st on st.id = a.staff_id and st.active and st.role >= 'agent'
  join public.calendar_connections cc on cc.staff_id = a.staff_id and cc.status = 'connected'
  join public.availability_windows w on w.staff_id = a.staff_id
  cross join lateral generate_series(
    (range_start at time zone a.timezone)::date - 1,
    (range_end at time zone a.timezone)::date,
    interval '1 day'
  ) d(day)
  cross join lateral generate_series(
    (d.day::date + w.start_time) at time zone a.timezone,
    ((d.day::date + w.end_time) at time zone a.timezone) - interval '30 minutes',
    interval '30 minutes'
  ) s(slot_start)
  where a.accepts_bookings
    and extract(isodow from d.day) = w.weekday
    and s.slot_start >= greatest(range_start, now() + interval '2 hours')
    and s.slot_start + interval '30 minutes' <= range_end
    and not exists (
      select 1 from public.bookings b
      where b.staff_id = a.staff_id and b.status <> 'cancelled'
        and b.during && tstzrange(s.slot_start, s.slot_start + interval '30 minutes')
    )
  order by 2, 1
$$;

-- What a booking link prefills on the booking page.
create function public.booking_link_info(token_hash text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('ticket_number', t.number, 'subject', t.subject,
                            'name', t.requester_name, 'email', t.requester_email)
  from public.ticket_booking_links l
  join public.tickets t on t.id = l.ticket_id
  where l.token_hash = booking_link_info.token_hash and l.expires_at > now()
$$;

-- Reserve a slot. Raises if it is no longer offered; the exclusion constraint
-- (23P01) catches two visitors racing for the same agent and time.
create function public.booking_create(
  staff_id uuid,
  starts_at timestamptz,
  requester_name text,
  requester_email text,
  topic text,
  cancel_token_hash text,
  link_token_hash text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  b public.bookings;
  linked uuid;
begin
  -- Reservations whose Google step never finished don't block slots forever.
  delete from public.bookings where status = 'pending' and created_at < now() - interval '10 minutes';

  if not exists (
    select 1 from public.booking_candidate_slots(booking_create.starts_at, booking_create.starts_at + interval '30 minutes') s
    where s.staff_id = booking_create.staff_id and s.starts_at = booking_create.starts_at
  ) then
    raise exception 'slot unavailable' using errcode = 'check_violation';
  end if;

  if link_token_hash is not null then
    select l.ticket_id into linked from public.ticket_booking_links l
    where l.token_hash = link_token_hash and l.expires_at > now();
    if linked is null then
      raise exception 'booking link expired' using errcode = 'no_data_found';
    end if;
  end if;

  insert into public.bookings (staff_id, ticket_id, requester_name, requester_email, topic, starts_at, ends_at, cancel_token_hash)
  values (booking_create.staff_id, linked, trim(requester_name), lower(trim(requester_email)), trim(topic),
          booking_create.starts_at, booking_create.starts_at + interval '30 minutes', cancel_token_hash)
  returning * into b;
  return b;
end;
$$;

-- After the Google event exists: confirm, and link to a ticket (a new
-- 'booking' ticket unless the visitor came from a ticket's booking link).
create function public.booking_confirm(booking_id uuid, google_event_id text, meet_url text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  b public.bookings;
  t public.tickets;
  agent_name text;
  note text;
begin
  select * into b from public.bookings where id = booking_id and status = 'pending' for update;
  if b.id is null then
    raise exception 'booking not found' using errcode = 'no_data_found';
  end if;
  select coalesce(nullif(full_name, ''), email) into agent_name from public.staff where id = b.staff_id;
  note := 'Call booked with ' || agent_name || ' for ' ||
          to_char(b.starts_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI') || ' UTC' ||
          coalesce(' (' || meet_url || ')', '') || '.';

  if b.ticket_id is null then
    insert into public.tickets (subject, channel, requester_email, requester_name, client_id, assignee_id)
    values (left('Call: ' || split_part(b.topic, E'\n', 1), 200), 'booking', b.requester_email, b.requester_name,
            public.match_client_by_email(b.requester_email), b.staff_id)
    returning * into t;
    insert into public.ticket_messages (ticket_id, kind, author_email, author_name, body_text)
    values (t.id, 'customer', b.requester_email, b.requester_name, b.topic);
  else
    select * into t from public.tickets where id = b.ticket_id;
    if b.topic is distinct from t.subject then
      insert into public.ticket_messages (ticket_id, kind, author_email, author_name, body_text)
      values (t.id, 'customer', b.requester_email, b.requester_name, b.topic);
    end if;
  end if;
  insert into public.ticket_messages (ticket_id, kind, body_text) values (t.id, 'system', note);

  update public.bookings
  set status = 'confirmed', ticket_id = t.id,
      google_event_id = booking_confirm.google_event_id, meet_url = booking_confirm.meet_url
  where id = b.id;
  return jsonb_build_object('ticket_number', t.number, 'agent_name', split_part(agent_name, ' ', 1));
end;
$$;

-- Cancel (by an agent through the API, or by the visitor's cancel link).
create function public.booking_cancel(booking_id uuid, cancelled_by text)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  b public.bookings;
begin
  update public.bookings set status = 'cancelled', cancelled_at = now()
  where id = booking_id and status <> 'cancelled'
  returning * into b;
  if b.id is null then
    raise exception 'booking not found' using errcode = 'no_data_found';
  end if;
  if b.ticket_id is not null then
    insert into public.ticket_messages (ticket_id, kind, body_text)
    values (b.ticket_id, 'system', 'Call on ' || to_char(b.starts_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI') ||
            ' UTC was cancelled by ' || cancelled_by || '.');
  end if;
  return b;
end;
$$;

revoke execute on function public.booking_candidate_slots(timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.booking_link_info(text) from public, anon, authenticated;
revoke execute on function public.booking_create(uuid, timestamptz, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.booking_confirm(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.booking_cancel(uuid, text) from public, anon, authenticated;
grant execute on function public.booking_candidate_slots(timestamptz, timestamptz) to service_role;
grant execute on function public.booking_link_info(text) to service_role;
grant execute on function public.booking_create(uuid, timestamptz, text, text, text, text, text) to service_role;
grant execute on function public.booking_confirm(uuid, text, text) to service_role;
grant execute on function public.booking_cancel(uuid, text) to service_role;

-- Agents mint booking links for tickets; returns the raw token once.
create function public.create_ticket_booking_link(ticket_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  if not public.has_role('agent') then
    raise exception 'permission denied' using errcode = 'insufficient_privilege';
  end if;
  if not exists (select 1 from public.tickets where id = create_ticket_booking_link.ticket_id) then
    raise exception 'ticket not found' using errcode = 'no_data_found';
  end if;
  insert into public.ticket_booking_links (token_hash, ticket_id, created_by)
  values (encode(extensions.digest(token, 'sha256'), 'hex'), create_ticket_booking_link.ticket_id, (select auth.uid()));
  return token;
end;
$$;

revoke execute on function public.create_ticket_booking_link(uuid) from public, anon;
grant execute on function public.create_ticket_booking_link(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------

alter table public.calendar_connections enable row level security;
alter table public.booking_agents enable row level security;
alter table public.availability_windows enable row level security;
alter table public.bookings enable row level security;
alter table public.ticket_booking_links enable row level security;

revoke all on public.calendar_connections, public.booking_agents, public.availability_windows,
  public.bookings, public.ticket_booking_links from anon;
grant select, insert, update, delete on public.calendar_connections, public.booking_agents,
  public.availability_windows, public.bookings, public.ticket_booking_links to service_role;

-- Staff see whether a calendar is connected, never the token.
grant select (staff_id, google_email, status, connected_at) on public.calendar_connections to authenticated;
create policy "staff read calendar status" on public.calendar_connections
  for select to authenticated using (public.has_role('viewer'));

grant select, insert, update, delete on public.booking_agents, public.availability_windows to authenticated;
create policy "staff read booking agents" on public.booking_agents
  for select to authenticated using (public.has_role('viewer'));
create policy "agents manage own booking hours" on public.booking_agents
  for all to authenticated
  using (public.has_role('admin') or (public.has_role('agent') and staff_id = (select auth.uid())))
  with check (public.has_role('admin') or (public.has_role('agent') and staff_id = (select auth.uid())));
create policy "staff read availability" on public.availability_windows
  for select to authenticated using (public.has_role('viewer'));
create policy "agents manage own availability" on public.availability_windows
  for all to authenticated
  using (public.has_role('admin') or (public.has_role('agent') and staff_id = (select auth.uid())))
  with check (public.has_role('admin') or (public.has_role('agent') and staff_id = (select auth.uid())));

-- Bookings change only through the API (which also updates Google).
grant select on public.bookings to authenticated;
create policy "staff read bookings" on public.bookings
  for select to authenticated using (public.has_role('viewer'));
