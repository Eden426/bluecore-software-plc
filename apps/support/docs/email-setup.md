# Support email setup (Resend)

How email becomes tickets and how agent replies reach customers.

## Flow

- **Inbound:** a customer writes to `SUPPORT_ADDRESS` (e.g. `support@blue-core.tech`). Resend receives the email and calls `POST /api/inbound-email` with an `email.received` webhook.
  - The function verifies the Svix signature, then fetches the body and headers from `GET https://api.resend.com/emails/receiving/{id}`. The webhook itself carries only metadata.
  - It then calls `ingest_inbound_email()` in Postgres, which creates a ticket or threads the email onto an existing one. See the comment on that function in `supabase/migrations/20261022130000_tickets.sql` for the threading and anti-spoofing rules.
  - Resend retries non-2xx responses. Ingestion is idempotent per Resend email id.
- **Outbound:** an agent's reply goes to `POST /api/tickets/reply`.
  - The message is saved as the agent, so RLS applies.
  - It's emailed from `SUPPORT_FROM_ADDRESS` with:
    - a `[BC-1234]` subject reference,
    - `In-Reply-To`/`References` headers pointing at earlier messages,
    - a per-ticket `Reply-To` of `support+<token>@<domain>`.
  - If Resend rejects the send, the message is deleted again.

## One-time setup

1. **Sending:** verify the sending domain in Resend (Domains) and set `SUPPORT_FROM_ADDRESS` to a mailbox on it.
2. **Receiving:** enable receiving for the domain of `SUPPORT_ADDRESS` in Resend and add the MX record Resend shows. If `blue-core.tech` already receives mail elsewhere (e.g. Google Workspace), use a subdomain such as `help.blue-core.tech` instead, because the domain can have only one MX target. Plus-addressed replies (`support+<token>@`) must reach the same inbox.
3. **Webhook:** in Resend, add a webhook for the event `email.received` pointing at `https://<support host>/api/inbound-email`. Copy its signing secret into `RESEND_WEBHOOK_SECRET`.
4. **Supabase:** set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` (the secret key is server-only and bypasses RLS, so never expose it to the browser).
5. **Rate limiting:** add a Vercel WAF rate-limit rule on `/api/inbound-email` and `/api/tickets/reply`, as for the marketing site's contact form.

## Local development

`npm run dev:support` serves `api/` through a Vite dev middleware. With `SUPPORT_EMAIL_TRANSPORT=log` in `apps/support/.env.local`, replies are recorded and the would-be email is logged instead of sent. Inbound email can't reach localhost; the seeded tickets in `supabase/seed.sql` are ingested through the same `ingest_inbound_email()` function, and `server/test/inbound.integration.test.js` runs the real webhook handler against local Supabase with a real Svix signature.

## Live chat endpoints

`/api/chat/start`, `/api/chat/messages` and `/api/chat/send` are public, like the inbound webhook. Add them to the Vercel WAF rate-limit rule, for example 10 requests a minute per IP for `start` and 60 for the other two. The database also caps each conversation at 500 messages and each message at 4,000 characters.
