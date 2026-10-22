-- Server-side code (apps/support/api) uses the secret key, i.e. service_role,
-- which bypasses RLS but still needs table privileges: newer Supabase projects
-- don't auto-grant them. Add new tables here (or grant in their migration).
grant select, insert, update, delete on
  public.staff, public.clients, public.client_domains, public.client_contacts,
  public.products, public.client_products,
  public.sla_policies, public.tickets, public.ticket_messages, public.ticket_events
to service_role;
