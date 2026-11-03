# One-to-one call booking (Google Calendar)

Customers book 30-minute Google Meet calls at `/book`. Each agent connects their
own Google Calendar from **Admin → Calls → My availability**: customers only see
times inside the agent's weekly hours that are free on that calendar, and booked
calls are added to it with a Meet link. Google emails the customer the invite.

## Google Cloud setup (once)

1. In Google Cloud Console, create (or pick) a project and enable the **Google Calendar API**.
2. **OAuth consent screen**:
   - User type **Internal** if Bluecore uses Google Workspace (agents must be in the workspace).
   - Otherwise **External**, then **publish** the app. While an External app is in
     *Testing*, Google expires refresh tokens after 7 days and agents would have to reconnect weekly.
   - Scopes: `openid`, `email`, `.../auth/calendar.events`, `.../auth/calendar.freebusy`.
     These are sensitive scopes; a published External app needs Google's verification.
3. **Credentials → Create OAuth client ID → Web application**. Authorized redirect URI:
   `https://support.blue-core.tech/api/google/callback` (and `http://localhost:5174/api/google/callback` for local use).
4. Set the server environment variables (Vercel, or `.env.local`):

| Variable | Value |
| --- | --- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From the OAuth client |
| `GOOGLE_REDIRECT_URI` | The redirect URI above for that environment |
| `GOOGLE_TOKEN_KEY` | A long random string (`openssl rand -hex 32`). Encrypts agents' refresh tokens and signs the OAuth state. Changing it disconnects every agent. |

## Local development without Google

`GOOGLE_CALENDAR_TRANSPORT=fake` (with `GOOGLE_TOKEN_KEY` and `GOOGLE_REDIRECT_URI`
set) skips Google entirely: "Connect" returns straight to the callback,
calendars are always free, and events get fake Meet links that are logged by the
dev server.

## How it works

- `api/booking/slots` asks the database for slots (`booking_candidate_slots()`:
  weekly hours in each agent's time zone, at least 2 hours ahead, minus existing
  bookings) and removes times busy on each agent's calendar (one free/busy call
  per agent). The window is capped at 14 days.
- `api/booking/book` re-checks the slot, picks the free agent with the fewest
  upcoming calls, reserves it (an exclusion constraint prevents double-booking),
  creates the Google event, then `booking_confirm()` links it to a ticket: a new
  `booking` ticket, or the existing one if the customer used a ticket's booking link.
  If Google fails, the reservation is removed.
- Agents create booking links from a ticket's **Calls** card. Links are valid
  for 30 days; only their SHA-256 is stored, and the token travels in the URL
  fragment (`/book#link=…`) so it isn't sent to servers or in Referer headers.
- Customers cancel with the link on their confirmation page (`/book/cancel#token=…`);
  agents cancel from **Calls**. Both delete the Google event (Google notifies the
  attendee) and note the cancellation on the ticket.
- If Google rejects an agent's refresh token, their connection is marked
  *needs reconnecting* and they stop being offered until they reconnect.

## Rate limiting

`/api/booking/slots`, `/api/booking/book` and `/api/booking/cancel` are public.
`slots` calls Google once per bookable agent, so add them to the Vercel WAF
rate-limit rule (for example 30 requests a minute per IP for `slots`, 5 for `book`).

## Known limitations

- Changes made directly in Google Calendar (moving or deleting the event) are not
  synced back; cancel from the Calls page instead.
- Calls are always 30 minutes, with 2 hours' minimum notice and a 14-day horizon.
- The live Google flow needs the OAuth client above; locally it has only been
  exercised through the fake transport and mocked-request tests.
