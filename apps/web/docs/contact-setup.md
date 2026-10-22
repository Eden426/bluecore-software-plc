# Resend contact form setup

The implementation is on `feat/resend-contact`. The Vite form sends JSON to the Node.js Vercel Function at `/api/contact`. That function calls Resend's HTTPS API using native server-side fetch; no browser email SDK or Resend npm dependency is needed. The form's fields and design are preserved.

## Where your existing API key and name go

Open https://vercel.com/dashboard, select the **Bluecore project serving blue-core.tech**, and open **Settings → Environment Variables**. Create these exact names:

| Name | Value |
| --- | --- |
| `RESEND_API_KEY` | The secret token from Resend, not the key's label/name. |
| `CONTACT_FROM_EMAIL` | One bare email address at your verified sending domain, for example `website@inquiries.blue-core.tech` **only after that subdomain is verified**. |
| `CONTACT_TO_EMAIL` | The real monitored inbox receiving inquiries, for example `team@blue-core.tech` if that mailbox is active. |

The key's descriptive name (for example “Bluecore Website”) stays in Resend and is not an environment variable. The outgoing display name is already **Bluecore Website**. Do not enter `Name <email>` syntax in either email variable: this implementation expects a single bare address. The visitor's address is used only for Reply-To. Never use `VITE_` for any of these settings, paste keys into chat, or commit real values.

## Required manual setup checklist

1. **Resend account:** Open https://resend.com/signup, sign up or sign in with your existing account, and complete account/email verification. Verify that you can open the Resend dashboard. Skip account creation if your existing key already belongs to the intended account/team.

2. **Sending domain:** Open https://resend.com/domains → **Add domain**. Choose a dedicated sending subdomain, such as `inquiries.blue-core.tech`, choose the appropriate sending region, and enable sending. Alternatively use `blue-core.tech` if it is already correctly verified. You do not need Resend receiving/inbound email for this form. Verify that the dashboard shows the domain you intend to use for `CONTACT_FROM_EMAIL`. A separate sending subdomain helps isolate sending reputation. [Official domain guidance](https://resend.com/docs/dashboard/domains/introduction).

3. **DNS:** Open the dashboard of the authoritative DNS provider for `blue-core.tech` (the provider managing its nameservers), then its DNS record editor. In Resend, open the new domain's DNS setup. Add **only the exact Type, Name/Host, Value/Target, and Priority shown by Resend** for sending verification, including its DKIM and SPF/return-path records as presented. Copy the actual values from your own dashboard; none are supplied or invented here. If the DNS editor appends the zone name, enter the relative host once, rather than duplicating `blue-core.tech`. Use DNS-only mode for mail records if your provider offers proxying. Preserve existing root-domain MX records, mailbox-provider records, DKIM selectors, SPF, DMARC, and website records. Do not add a second SPF TXT policy at the same name or overwrite a conflicting record; use a distinct sending subdomain or resolve that conflict with the DNS administrator. Do not enable inbound receiving or replace the root MX records. Return to Resend, select **Verify DNS records**, and wait until sending verification is **Verified**. This is the verification criterion; propagation may take time. Confirm the existing `team@blue-core.tech` mailbox still receives ordinary email.

4. **Restricted API key:** Open https://resend.com/api-keys → **Create API key**. Give it a descriptive name, select **Sending access**, and restrict it to the verified sending domain from step 2. Save the secret in your password manager when displayed. If you already have a key, check its permission and domain; replace a broadly privileged key with a restricted sending key. Verify the key row shows the intended domain and sending permission. Put its secret value directly into Vercel, not into source code. [Official API-key guidance](https://resend.com/docs/dashboard/api-keys/introduction).

5. **Vercel environment:** Open https://vercel.com/dashboard → the Bluecore project → **Settings → Environment Variables**. Add the three variables in the table above. Enable **Production** and **Preview** for branch testing; scope Preview values to `feat/resend-contact` if desired. For Preview, a separate restricted key and a test recipient are preferable. Add **Development** values too if you want CLI development to use dashboard configuration. Mark `RESEND_API_KEY` sensitive where offered for the deployed environments. Remove obsolete browser-mail service variables and `VITE_CONTACT_EMAIL`; do not remove unrelated settings. Verify the exact variable names and environment scopes in the list without sharing their values. Changes apply to new deployments, so deploy again after changing them. [Official environment-variable guidance](https://vercel.com/docs/environment-variables).

6. **Required distributed abuse protection:** In the Vercel project open **Firewall → Configure → + New Rule**. Name it **Contact form rate limit**. Match **Request Path equals `/api/contact` AND Request Method equals `POST`**. Set the action to **Rate Limit**, strategy **Fixed Window**, limit **5 requests per 60 seconds**, keyed by **IP Address**, and the limit-exceeded action to **Deny**. Save the rule, then **Review Changes → Publish**. Confirm it is enabled for the deployment you are testing. Availability/quotas depend on the project's Vercel plan; if unavailable, arrange a supported WAF rate-limit plan or a persistent Redis-based limiter before enabling this public endpoint. No in-memory limiter is used or presented as protection. The code's same-origin checks, honeypot, size limits and idempotency do not replace rate limiting or stop distributed bots. [Official WAF setup](https://vercel.com/kb/guide/limit-abuse-with-rate-limiting). To verify without sending emails, run six same-origin POSTs with invalid form data from the site's browser console, inspect **Network** for a rate-limit denial (normally 429; the configured firewall can use another denial response), and check **Firewall → Events**. The underlying validation returns 400 and does not call Resend. Do not use valid test inquiries for this flood test.

   While viewing your deployed site, this browser-console check sends invalid bodies that cannot reach Resend:

   ```js
   await Promise.all(Array.from({ length: 6 }, async () => {
     const response = await fetch('/api/contact', {
       method: 'POST', headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ website: '' }),
     });
     return response.status;
   }));
   ```

7. **Local development:** Use Node.js 24, then run the following in the repository root:

   ```sh
   npm ci
   npm install --global vercel
   vercel login
   vercel link
   npm run dev:vercel
   ```

   During `vercel link`, select the existing team and **existing Bluecore project**, not a new project. Open http://localhost:3000. `vercel dev` runs both Vite and `/api/contact` and downloads the linked project's Development variables. For file-based configuration, copy `.env.example` to `.env` **only if that file does not already exist**, and enter the three values locally using an editor; keep it ignored by Git. The installed Vercel CLI 64 reads `.env` for local function variables; Vite's `.env.local` alone does not supply those function variables. If `.env` already exists, preserve its unrelated settings and add or update only the three contact settings. Restart `vercel dev` after changing values. Keep the Vercel project's Development Command at the default Vite command/`npm run dev`, not `npm run dev:vercel`, to avoid recursion. Plain `npm run dev` (Vite) and `npm run preview` do not provide serverless endpoints. Verify that opening `/api/contact` in the browser returns JSON with HTTP 405, rather than the SPA HTML. A real valid local submission sends real email through Resend. Firewall rate limiting applies on Vercel, not on the local CLI. [Official local development guidance](https://vercel.com/docs/cli/dev).

8. **Review and deploy:** This workspace has no authenticated Vercel CLI/project connection available, so no live deployment or account/DNS changes were performed. Push the branch to the repository and open a PR into `main`. Run `npm run lint`, `npm test`, and `npm run build`; the existing GitHub Actions validation runs the same checks on the PR. To review a Preview before merging, use the following after Vercel login/link and Preview environment setup:

   ```sh
   vercel pull --yes --environment=preview --git-branch=feat/resend-contact
   vercel build
   vercel deploy --prebuilt
   ```

   Open the returned Preview URL. The repository intentionally deploys prebuilt output; its native Vercel Git auto-build is not the established deployment path. Once reviewed, merge the PR into `main`: the existing **Build and Deploy** GitHub Actions workflow validates, runs `vercel pull`, `vercel build --prod`, and `vercel deploy --prebuilt --prod`. Ensure the repo already has its `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` Actions secrets configured; do not paste them in chat. In Vercel **Settings → Build and Deployment**, use the Vite preset, root repository directory, output `dist`, build `npm run build`, and Node.js 24. If a manual production redeploy is needed after environment changes, run:

   ```sh
   vercel pull --yes --environment=production
   vercel build --prod
   vercel deploy --prebuilt --prod
   ```

   Verify Vercel's new deployment is Ready and lists `/api/contact` as a Function. GET `/api/contact` should return JSON 405; unknown `/api/*` paths must not return the SPA page. The API is excluded from the SPA rewrite.

9. **End-to-end verification:** Open the Preview URL (then https://blue-core.tech after production deployment), fill in a legitimate test inquiry with an email you control, and submit once. The UI should show loading, prevent duplicate submissions, and then report **accepted for sending** on HTTP 202. In https://resend.com/emails, find the matching inquiry and inspect its event history. Check the recipient's actual inbox and spam folder, then use Reply to verify it targets your visitor address. A 202 or Resend send ID means API acceptance, not confirmed inbox arrival. A provider delivery event means the receiving server accepted it; only opening the message in the intended inbox verifies inbox placement. Also test an offline/failed request: the form must retain inputs and provide an accessible error without opening a mail app. Remove obsolete local environment variables and revoke old unused browser-mail credentials after successful rollout.

## Implemented safeguards and limits

- POST-only, same-origin JSON; 32 KiB limit on actual bytes read, including chunked bodies; no wildcard CORS.
- Server validation: name 2–100 characters; email up to 254; company up to 200; message 10–5,000; honeypot up to 200. Disallowed control characters are rejected.
- Required `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL` remain exclusively in server code. Sender and recipient are fixed by configuration; visitor email is only Reply-To.
- HTML escapes user content, alongside an explicit plain-text email. No attachments, submitted recipients, or dynamic subject headers.
- A submission UUID and payload hash form a Resend idempotency key; unchanged retries reuse it. Resend deduplicates the same key for 24 hours. This avoids duplicate sends after network failures and works across instances; it is not a rate limiter. [Send API / idempotency documentation](https://resend.com/docs/api-reference/emails/send-email).
- Provider requests time out after 10 seconds; browser requests after 20. Failure preserves the form. The server never returns raw provider errors or logs email content, secrets, or visitor data.
- Required deployment-side WAF rate limiting is configured in step 6. Further bot challenges or persistent global sending quotas may be needed if distributed abuse occurs; do not treat IP limiting as a complete bot defense.
- No automatic `mailto:` submission fallback. Ordinary published email contact links remain as contact information.

## Verification status

Automated tests mock Resend and never send mail. Real account settings, domain verification, Vercel Firewall publication, deployed function routing, and actual inbox delivery must be checked using the checklist above. They are not claimed as verified by local tests.
