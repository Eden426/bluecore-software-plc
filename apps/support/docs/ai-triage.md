# AI triage and the dashboard

## What it does

When a ticket arrives by email, the server asks Claude to read it and stores a
suggestion in `ticket_ai_triage`:

- a priority (low, normal, high, urgent) with a one-line reason
- the product it's about, chosen only from the products the server sends
- a category and up to four tags
- a one-sentence summary and a draft first reply

Email and call booking tickets are triaged on arrival; a booking is triaged just
after the customer gets their confirmation. Tickets created in the admin console,
including converted chats, are triaged when they open. Agents can rerun it at any time.

**Nothing changes on the ticket automatically.** The AI triage card on the
ticket page lets an agent apply the priority, product and tags (only the ones
that differ), dismiss the suggestion, or put the draft reply into the reply box
to edit before sending. Applying runs as the agent, so the audit trail credits
them. Viewers can see suggestions but not act on them.

## Setup

Set these on the server (never `VITE_`-prefixed):

| Variable | |
|---|---|
| `ANTHROPIC_API_KEY` | Required. An API key from the Claude Console. |
| `AI_TRIAGE_MODEL` | Optional. Defaults to `claude-opus-5-5`. |
| `AI_TRIAGE_TRANSPORT=fake` | Local development only: keyword rules instead of Claude, no key needed. |

Without a key (and without the fake transport), tickets work as before and the
card shows "AI triage is not configured".

## How it calls Claude

`server/triage.js` uses the official `@anthropic-ai/sdk`:

- Structured outputs (`output_config.format` with a JSON schema), so the reply
  is always valid JSON in the expected shape.
- `effort: "low"`, which is plenty for classification and keeps cost and
  latency down.
- Server-side refusal fallbacks (`fallbacks: "default"`), so a safety-classifier
  decline is retried on another model instead of failing.
- At most six customer messages and 12,000 characters per ticket. Agent replies
  and internal notes are never sent.
- The prompt tells Claude to treat ticket text as data and ignore instructions
  in it. Even so, a ticket could try to steer its own priority, which is why an
  agent always reviews the suggestion.

## Privacy

Ticket subjects and customer messages are sent to Anthropic's API. Bespoke
product names are sent only for the ticket's own client. Check this fits your
clients' agreements before turning it on.

## Dashboard

`/admin/dashboard` is available to all staff and calls one database function,
`support_dashboard(days)`:

- **Right now:** open, unassigned, first reply overdue, resolution overdue.
- **Over 7, 30 or 90 days:** created, solved, median first reply time, the
  share of first replies within SLA, tickets per day, open tickets by priority
  and status, new tickets by channel, the busiest clients, per-agent load, and
  how often AI suggestions were applied.
