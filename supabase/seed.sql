-- Local development seed only (`supabase db reset`). Never run against production.
-- Test staff logins (password for all three: bluecore-dev-password):
--   admin@bluecore.test, agent@bluecore.test, viewer@bluecore.test

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('bluecore-dev-password', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', u.full_name),
  now(), now(), '', '', '', ''
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'admin@bluecore.test', 'Dev Admin'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'agent@bluecore.test', 'Dev Agent'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'viewer@bluecore.test', 'Dev Viewer')
) as u (id, email, full_name);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
select gen_random_uuid(), id, id::text, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
from auth.users where email like '%@bluecore.test';

update public.staff set role = 'admin' where email = 'admin@bluecore.test';
update public.staff set role = 'agent' where email = 'agent@bluecore.test';

insert into public.clients (id, name, slug, sla_tier, notes) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Addis Logistics', 'addis-logistics', 'priority', 'Runs Garage OS across 3 branches.'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Abay Health', 'abay-health', 'enterprise', 'Bespoke patient portal.');

insert into public.client_domains (client_id, domain) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'addislogistics.example'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'abayhealth.example');

insert into public.client_contacts (client_id, full_name, email, job_title, is_primary) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Sara Tesfaye', 'sara@addislogistics.example', 'IT Manager', true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Dawit Bekele', 'dawit@abayhealth.example', 'CTO', true);

insert into public.products (id, name, slug, kind, owner_client_id, description) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Bluecore Garage OS', 'garage-os', 'shared', null, 'Workshop and service management.'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Bluecore ERP', 'erp', 'shared', null, 'Finance, inventory and HR.'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'Abay Patient Portal', 'abay-patient-portal', 'bespoke', 'aaaaaaaa-0000-0000-0000-000000000002', 'Appointments and records portal.');

insert into public.client_products (client_id, product_id, environment, url, version) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'production', 'https://garage.addislogistics.example', '2.4.1'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000003', 'production', 'https://portal.abayhealth.example', '1.0.0');

-- Sample tickets, ingested the same way real inbound email is.
select public.ingest_inbound_email(jsonb_build_object(
  'resend_email_id', 'seed-1', 'from_email', 'sara@addislogistics.example', 'from_name', 'Sara Tesfaye',
  'to', jsonb_build_array('support@blue-core.tech'), 'subject', 'Garage OS invoices not printing',
  'text', E'Hi,\n\nSince this morning none of our branches can print invoices from Garage OS.\n\nSara', 'message_id', '<seed-1@addislogistics.example>'));
select public.ingest_inbound_email(jsonb_build_object(
  'resend_email_id', 'seed-2', 'from_email', 'dawit@abayhealth.example', 'from_name', 'Dawit Bekele',
  'to', jsonb_build_array('support@blue-core.tech'), 'subject', 'Patient portal login loop',
  'text', 'Patients get sent back to the login page after entering their OTP.', 'message_id', '<seed-2@abayhealth.example>'));
select public.ingest_inbound_email(jsonb_build_object(
  'resend_email_id', 'seed-3', 'from_email', 'hello@newprospect.example', 'from_name', 'Meron',
  'to', jsonb_build_array('support@blue-core.tech'), 'subject', 'Question about ERP pricing',
  'text', 'Do you offer ERP for a 40-person company?', 'message_id', '<seed-3@newprospect.example>'));
update public.tickets set priority = 'urgent' where subject = 'Patient portal login loop';
