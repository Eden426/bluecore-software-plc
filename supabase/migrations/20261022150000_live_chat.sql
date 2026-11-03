-- Phase 5: live chat between help-center visitors and Bluecore agents.
--
-- Visitors never authenticate with Supabase (staff-only auth stays intact:
-- anonymous sign-ins count as sign-ups, which are disabled). Instead the
-- server (apps/support/api/chat/*) issues each conversation a random visitor
-- token, stores only its SHA-256 hash here, and calls the service-role-only
-- chat_visitor_* functions below. Agents use the tables directly under RLS and
-- get live updates through Realtime postgres changes. Visitors get live
-- updates via content-free Realtime broadcast pings on a channel named by
-- channel_key, then fetch messages through the API.

create type public.chat_status as enum ('waiting', 'active', 'closed');
create type public.chat_sender as enum ('visitor', 'agent', 'system');

create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  -- Names the visitor's Realtime broadcast channel. Separate from the token,
  -- so knowing the channel only lets you see "something changed" pings.
  channel_key text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  visitor_name text not null check (length(trim(visitor_name)) between 1 and 120),
  visitor_email text not null check (visitor_email = lower(visitor_email) and visitor_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  status public.chat_status not null default 'waiting',
  assignee_id uuid references public.staff (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  ticket_id uuid references public.tickets (id) on delete set null,
  -- Page the visitor started from, for context.
  page_url text not null default '' check (length(page_url) <= 500),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  closed_at timestamptz
);
create index chat_conversations_status_idx on public.chat_conversations (status, last_message_at desc);

create table public.chat_messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  sender public.chat_sender not null,
  author_staff_id uuid references public.staff (id) on delete set null,
  author_name text not null default '',
  body text not null check (length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index chat_messages_conversation_idx on public.chat_messages (conversation_id, id);

-- Per-conversation cap so one token can't fill the database.
create function public.chat_messages_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.chat_messages where conversation_id = new.conversation_id) >= 500 then
    raise exception 'conversation message limit reached' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger chat_messages_before_insert before insert on public.chat_messages
  for each row execute function public.chat_messages_before_insert();

-- Keep the conversation in step: any message bumps last_message_at; the first
-- agent reply claims an unassigned chat and makes it active.
create function public.chat_messages_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.chat_conversations
  set last_message_at = new.created_at,
      status = case when new.sender = 'agent' and status = 'waiting' then 'active' else status end,
      assignee_id = case when new.sender = 'agent' then coalesce(assignee_id, new.author_staff_id) else assignee_id end
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger chat_messages_after_insert after insert on public.chat_messages
  for each row execute function public.chat_messages_after_insert();

create function public.chat_conversations_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'closed' and old.status <> 'closed' then
    new.closed_at := now();
  elsif new.status <> 'closed' then
    new.closed_at := null;
  end if;
  return new;
end;
$$;

create trigger chat_conversations_before_update before update on public.chat_conversations
  for each row execute function public.chat_conversations_before_update();

-- ---------------------------------------------------------------------------
-- Visitor operations (service role only; the API hashes the visitor token)
-- ---------------------------------------------------------------------------

create function public.chat_visitor_start(
  token_hash text,
  visitor_name text,
  visitor_email text,
  body text,
  page_url text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.chat_conversations;
begin
  insert into public.chat_conversations (token_hash, visitor_name, visitor_email, client_id, page_url)
  values (
    token_hash, trim(visitor_name), lower(trim(visitor_email)),
    public.match_client_by_email(visitor_email), left(coalesce(page_url, ''), 500)
  )
  returning * into c;
  insert into public.chat_messages (conversation_id, sender, author_name, body)
  values (c.id, 'visitor', c.visitor_name, trim(body));
  return jsonb_build_object('conversation_id', c.id, 'channel_key', c.channel_key);
end;
$$;

create function public.chat_visitor_send(token_hash text, body text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.chat_conversations;
  m public.chat_messages;
begin
  select * into c from public.chat_conversations where chat_conversations.token_hash = chat_visitor_send.token_hash;
  if c.id is null then
    raise exception 'conversation not found' using errcode = 'no_data_found';
  end if;
  if c.status = 'closed' then
    raise exception 'conversation is closed' using errcode = 'check_violation';
  end if;
  insert into public.chat_messages (conversation_id, sender, author_name, body)
  values (c.id, 'visitor', c.visitor_name, trim(body))
  returning * into m;
  return jsonb_build_object('id', m.id, 'created_at', m.created_at);
end;
$$;

-- The visitor's view: conversation state plus messages after a given id.
-- Agents are shown by first name only.
create function public.chat_visitor_messages(token_hash text, after_id bigint default 0)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  c public.chat_conversations;
begin
  select * into c from public.chat_conversations where chat_conversations.token_hash = chat_visitor_messages.token_hash;
  if c.id is null then
    raise exception 'conversation not found' using errcode = 'no_data_found';
  end if;
  return jsonb_build_object(
    'status', c.status,
    'channel_key', c.channel_key,
    'ticket_number', (select number from public.tickets where id = c.ticket_id),
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id,
        'sender', m.sender,
        'author_name', case when m.sender = 'agent' then split_part(m.author_name, ' ', 1) else m.author_name end,
        'body', m.body,
        'created_at', m.created_at
      ) order by m.id)
      from public.chat_messages m
      where m.conversation_id = c.id and m.id > coalesce(after_id, 0)
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.chat_visitor_start(text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.chat_visitor_send(text, text) from public, anon, authenticated;
revoke execute on function public.chat_visitor_messages(text, bigint) from public, anon, authenticated;
grant execute on function public.chat_visitor_start(text, text, text, text, text) to service_role;
grant execute on function public.chat_visitor_send(text, text) to service_role;
grant execute on function public.chat_visitor_messages(text, bigint) to service_role;

-- ---------------------------------------------------------------------------
-- Turning a chat into a ticket (agents)
-- ---------------------------------------------------------------------------

create function public.convert_chat_to_ticket(conversation_id uuid)
returns public.tickets
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.chat_conversations;
  t public.tickets;
  first_line text;
begin
  if not public.has_role('agent') then
    raise exception 'permission denied' using errcode = 'insufficient_privilege';
  end if;
  select * into c from public.chat_conversations where id = convert_chat_to_ticket.conversation_id for update;
  if c.id is null then
    raise exception 'conversation not found' using errcode = 'no_data_found';
  end if;
  if c.ticket_id is not null then
    select * into t from public.tickets where id = c.ticket_id;
    return t;
  end if;

  select left(split_part(body, E'\n', 1), 120) into first_line
  from public.chat_messages
  where chat_messages.conversation_id = c.id and sender = 'visitor'
  order by id limit 1;

  insert into public.tickets (subject, channel, requester_email, requester_name, client_id, assignee_id)
  values (coalesce(nullif(trim(first_line), ''), 'Chat with ' || c.visitor_name), 'chat',
          c.visitor_email, c.visitor_name, c.client_id, coalesce(c.assignee_id, (select auth.uid())))
  returning * into t;

  -- Copy the transcript: visitor lines become customer messages, agent lines
  -- become notes (they were already seen live, so nothing is emailed).
  insert into public.ticket_messages (ticket_id, kind, author_staff_id, author_email, author_name, body_text, created_at)
  select t.id,
         case when m.sender = 'visitor' then 'customer'::public.message_kind else 'note'::public.message_kind end,
         m.author_staff_id,
         case when m.sender = 'visitor' then c.visitor_email else '' end,
         m.author_name,
         case when m.sender = 'agent' then '[Live chat reply] ' || m.body else m.body end,
         m.created_at
  from public.chat_messages m
  where m.conversation_id = c.id and m.sender <> 'system'
  order by m.id;

  -- The agent already answered live, so that counts as the first response.
  update public.tickets
  set first_responded_at = (select min(created_at) from public.chat_messages
                            where chat_messages.conversation_id = c.id and sender = 'agent'),
      status = case when exists (select 1 from public.chat_messages
                                 where chat_messages.conversation_id = c.id and sender = 'agent')
                    then 'open'::public.ticket_status else status end
  where id = t.id
  returning * into t;

  update public.chat_conversations set ticket_id = t.id where id = c.id;
  insert into public.chat_messages (conversation_id, sender, author_name, body)
  values (c.id, 'system', '', 'This conversation was saved as ticket BC-' || t.number || '. We''ll follow up by email.');
  return t;
end;
$$;

revoke execute on function public.convert_chat_to_ticket(uuid) from public, anon;
grant execute on function public.convert_chat_to_ticket(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

revoke all on public.chat_conversations, public.chat_messages from anon;
grant select on public.chat_conversations, public.chat_messages to authenticated;
grant update (status, assignee_id, client_id) on public.chat_conversations to authenticated;
grant insert (conversation_id, sender, author_staff_id, author_name, body) on public.chat_messages to authenticated;
grant select, insert, update, delete on public.chat_conversations, public.chat_messages to service_role;

create policy "staff read chats" on public.chat_conversations
  for select to authenticated using (public.has_role('viewer'));
create policy "agents update chats" on public.chat_conversations
  for update to authenticated using (public.has_role('agent')) with check (public.has_role('agent'));

create policy "staff read chat messages" on public.chat_messages
  for select to authenticated using (public.has_role('viewer'));
create policy "agents reply in open chats" on public.chat_messages
  for insert to authenticated
  with check (
    public.has_role('agent')
    and sender = 'agent'
    and author_staff_id = (select auth.uid())
    and exists (select 1 from public.chat_conversations c where c.id = conversation_id and c.status <> 'closed')
  );

-- Live updates for the agent console (RLS applies to postgres changes).
alter publication supabase_realtime add table public.chat_conversations, public.chat_messages;
