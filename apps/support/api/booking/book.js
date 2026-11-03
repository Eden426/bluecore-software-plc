import {
  agentAccessToken,
  bookingError,
  freeSlots,
  hashToken,
  newCancelToken,
  readJson,
  readLinkToken,
  serviceClient,
  validateBooking,
} from "../../server/booking.js";
import { createEvent, googleConfig, googleFetch } from "../../server/google.js";
import { json } from "../../server/http.js";

const SLOT = 30 * 60_000;

// POST { start, name, email, topic, link? } -> { booking, cancelToken }
// Picks a free agent (fewest upcoming calls first), reserves the slot in the
// database, creates the Google event with a Meet link (Google emails the
// invite), then confirms it onto a ticket. If Google fails, the reservation is
// removed. Needs a WAF rate limit.
export async function handleBook(request, { db, config, fetchImpl } = {}) {
  if (request.method !== "POST") return json(405, { error: "Method not allowed." }, { Allow: "POST" });
  let input;
  try {
    input = await readJson(request);
  } catch {
    return json(400, { error: "Invalid request." });
  }
  const { errors, values } = validateBooking(input);
  if (Object.keys(errors).length) return json(400, { error: "Please check your details.", errors });
  const linkToken = input?.link ? readLinkToken(input.link) : null;
  if (input?.link && !linkToken) return json(410, { error: "This booking link has expired. Ask us for a new one." });

  config ??= googleConfig();
  const client = db ?? serviceClient();
  if (!client || !config) return json(503, { error: "Booking is unavailable right now." });
  fetchImpl ??= googleFetch(config);

  const start = Date.parse(values.start);
  const end = new Date(start + SLOT).toISOString();
  let free;
  try {
    // Re-check this exact slot against live calendars; the page may be stale.
    free = (await freeSlots(client, config, fetchImpl, values.start, end)).get(values.start) ?? [];
  } catch (error) {
    return bookingError(error);
  }
  if (!free.length) return json(409, { error: "That time was just taken. Please pick another." });

  const { data: upcoming } = await client
    .from("bookings")
    .select("staff_id")
    .in("staff_id", free)
    .neq("status", "cancelled")
    .gte("starts_at", new Date().toISOString());
  const load = (id) => (upcoming ?? []).filter((b) => b.staff_id === id).length;
  const staffId = [...free].sort((a, b) => load(a) - load(b))[0];

  const cancelToken = newCancelToken();
  const { data: booking, error } = await client.rpc("booking_create", {
    staff_id: staffId,
    starts_at: values.start,
    requester_name: values.name,
    requester_email: values.email,
    topic: values.topic,
    cancel_token_hash: hashToken(cancelToken),
    link_token_hash: linkToken ? hashToken(linkToken) : null,
  });
  if (error) return bookingError(error);

  let event;
  try {
    const token = await agentAccessToken(client, config, staffId, fetchImpl);
    event = await createEvent(
      token,
      {
        bookingId: booking.id,
        summary: `Bluecore support call: ${values.topic.split("\n")[0].replace(/^Call:\s*/i, "").slice(0, 80)}`,
        description: `${values.topic}\n\nBooked by ${values.name} via the Bluecore help center.`,
        start: values.start,
        end,
        attendee: { email: values.email, displayName: values.name },
      },
      fetchImpl,
    );
  } catch (err) {
    console.error("Google event creation failed", { message: err.message });
    await client.from("bookings").delete().eq("id", booking.id);
    return json(502, { error: "We couldn't add the call to our calendar. Please try another time." });
  }

  const { data: confirmed, error: confirmError } = await client.rpc("booking_confirm", {
    booking_id: booking.id,
    google_event_id: event.id,
    meet_url: event.meetUrl,
  });
  if (confirmError) return bookingError(confirmError);

  return json(201, {
    cancelToken,
    booking: {
      start: values.start,
      end,
      agentName: confirmed.agent_name,
      meetUrl: event.meetUrl,
      ticketNumber: confirmed.ticket_number,
    },
  });
}

export default { fetch: (request) => handleBook(request) };
