import { HORIZON_DAYS, bookingError, freeSlots, hashToken, readLinkToken, serviceClient } from "../../server/booking.js";
import { googleConfig, googleFetch } from "../../server/google.js";
import { json } from "../../server/http.js";

const DAY = 86_400_000;

// GET ?from=ISO&to=ISO[&link=token] -> { slots: [{ start, end }], link }
// Times when at least one agent is free. Agents aren't named until booked.
// `link` (a ticket booking link) returns the ticket details to prefill.
// Calls Google once per bookable agent, so it needs a WAF rate limit.
export async function handleSlots(request, { db, config, fetchImpl, now = Date.now() } = {}) {
  if (request.method !== "GET") return json(405, { error: "Method not allowed." }, { Allow: "GET" });
  const params = new URL(request.url).searchParams;
  const from = Math.max(Date.parse(params.get("from")) || now, now);
  const to = Math.min(Date.parse(params.get("to")) || from + 7 * DAY, now + HORIZON_DAYS * DAY, from + HORIZON_DAYS * DAY);
  config ??= googleConfig();
  const client = db ?? serviceClient();
  if (!client || !config) return json(503, { error: "Booking is unavailable right now." });

  let link = null;
  const linkToken = readLinkToken(params.get("link"));
  if (linkToken) {
    const { data } = await client.rpc("booking_link_info", { token_hash: hashToken(linkToken) });
    link = data ?? null;
    if (!link) return json(410, { error: "This booking link has expired. Ask us for a new one." });
  }
  if (to <= from) return json(200, { slots: [], link });

  try {
    const slots = await freeSlots(client, config, fetchImpl ?? googleFetch(config), new Date(from).toISOString(), new Date(to).toISOString());
    const list = [...slots.keys()].sort().map((start) => ({ start, end: new Date(Date.parse(start) + 30 * 60_000).toISOString() }));
    return json(200, { slots: list, link });
  } catch (error) {
    return bookingError(error);
  }
}

export default { fetch: (request) => handleSlots(request) };
