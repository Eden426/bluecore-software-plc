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

-- Help center sample content.
insert into public.kb_articles (type, title, slug, summary, body, category, product_id, tags, status, visibility, position) values
  ('article', 'How to contact Bluecore support', 'how-to-contact-support',
   'The fastest ways to reach us, and what to include so we can help quickly.',
   E'## Email\n\nWrite to **support@blue-core.tech**. Every email opens a ticket, and replies keep the same thread.\n\n## What to include\n\n- The product and environment (for example *Garage OS, production*)\n- What you expected and what happened instead\n- Screenshots or error messages\n- When it started\n\n## Response times\n\nResponse targets depend on your support plan and the priority of the issue.',
   'Getting started', null, '{support,contact}', 'published', 'public', 1),
  ('article', 'Resetting a user''s password', 'resetting-a-users-password',
   'Administrators can reset passwords for their team from the admin panel.',
   E'1. Sign in as an administrator.\n2. Open **Settings → Users**.\n3. Choose the user and select **Reset password**.\n\nThe user receives an email with a link that expires after 24 hours.',
   'Accounts', null, '{password,login,users}', 'published', 'public', 2),
  ('faq', 'What are your support hours?', 'support-hours',
   '', E'Our team works **Monday to Friday, 8:30–17:30 (EAT)**. Urgent issues for enterprise plans are monitored outside those hours.',
   'General', null, '{hours}', 'published', 'public', 1),
  ('faq', 'How do I report a security issue?', 'report-security-issue',
   '', E'Email **security@blue-core.tech** with details. Please don''t include sensitive data in a regular support ticket.',
   'General', null, '{security}', 'published', 'public', 2),
  ('faq', 'Can I request a new feature?', 'request-a-feature',
   '', E'Yes. Open a ticket describing the problem you want solved. We review requests with each product''s roadmap.',
   'General', null, '{features}', 'published', 'public', 3),
  ('doc', 'Garage OS: printing invoices', 'garage-os-printing-invoices',
   'Set up invoice printers per branch and fix common printing problems.',
   E'## Set up a printer\n\nOpen **Branch settings → Printing** and choose the default invoice printer.\n\n## Invoices don''t print\n\n1. Check the printer is online and set as default for the branch.\n2. Clear the print queue on the workstation.\n3. Restart the **Garage OS Print Service**.\n\nIf printing still fails, open a ticket and include the branch name.',
   'Invoicing', 'bbbbbbbb-0000-0000-0000-000000000001', '{printing,invoices}', 'published', 'public', 1),
  ('doc', 'ERP: closing a financial period', 'erp-closing-a-financial-period',
   'Lock a period so no more entries can be posted to it.',
   E'Go to **Finance → Periods**, select the period and choose **Close period**. Only users with the *Finance admin* role can reopen it.',
   'Finance', 'bbbbbbbb-0000-0000-0000-000000000002', '{finance,periods}', 'published', 'public', 1),
  ('update', 'Garage OS 2.4: faster job cards', 'garage-os-2-4',
   'Job cards load up to 3× faster and support photo attachments.',
   E'### New\n\n- Attach photos to job cards from a phone or tablet.\n\n### Improved\n\n- Job cards load up to 3× faster on large branches.\n\n### Fixed\n\n- Invoice totals now round consistently with VAT rules.',
   '', 'bbbbbbbb-0000-0000-0000-000000000001', '{release}', 'published', 'public', 0),
  ('doc', 'Abay portal: OTP provider runbook', 'abay-portal-otp-runbook',
   'Internal steps for diagnosing OTP delivery for the Abay patient portal.',
   E'Check the SMS gateway dashboard, then the portal''s `otp_attempts` table for failures.',
   'Runbooks', 'bbbbbbbb-0000-0000-0000-000000000003', '{otp,runbook}', 'published', 'internal', 1),
  ('article', 'Single sign-on with Microsoft 365', 'sso-microsoft-365',
   'Coming soon: let your team sign in with their work accounts.',
   E'Draft — not ready to publish.', 'Accounts', null, '{sso}', 'draft', 'public', 3);
