import {
  agentAccessToken,
  bookingError,
  hashToken,
  readCancelToken,
  readJson,
  serviceClient,
  staffFromRequest,
} from "../../server/booking.js";
import { deleteEvent, googleConfig, googleFetch } from "../../server/google.js";
import { json } from "../../server/http.js";

const PUBLIC_FIELDS = "id, starts_at, ends_at, status, meet_url, topic, staff:staff_id(full_name)";

// GET with X-Booking-Token -> the visitor's booking (for the cancel page).
// POST { token } (visitor) or { bookingId } with an agent's Bearer token ->
// cancels it, deletes the Google event (Google tells the attendee) and notes
// it on the ticket.
export async function handleCancel(request, { db, config, fetchImpl } = {}) {
  if (!["GET", "POST"].includes(request.method)) return json(405, { error: "Method not allowed." }, { Allow: "GET, POST" });
  config ??= googleConfig();
  const client = db ?? serviceClient();
  if (!client || !config) return json(503, { error: "Booking is unavailable right now." });

  if (request.method === "GET") {
    const token = readCancelToken(request.headers.get("x-booking-token"));
    if (!token) return json(404, { error: "Booking not found." });
    const { data } = await client.from("bookings").select(PUBLIC_FIELDS).eq("cancel_token_hash", hashToken(token)).maybeSingle();
    if (!data) return json(404, { error: "Booking not found." });
    const { staff, ...rest } = data;
    return json(200, { booking: { ...rest, agent_name: (staff?.full_name ?? "").split(" ")[0] } });
  }

  let input;
  try {
    input = await readJson(request);
  } catch {
    return json(400, { error: "Invalid request." });
  }
  let booking;
  let cancelledBy;
  if (input?.token) {
    const token = readCancelToken(input.token);
    if (token) {
      ({ data: booking } = await client.from("bookings").select("id, status").eq("cancel_token_hash", hashToken(token)).maybeSingle());
    }
    cancelledBy = "the customer";
  } else {
    const staff = await staffFromRequest(request, client);
    if (!staff) return json(401, { error: "Sign in required." });
    if (!["agent", "admin"].includes(staff.role)) return json(403, { error: "You don't have permission to cancel calls." });
    ({ data: booking } = await client.from("bookings").select("id, status").eq("id", input?.bookingId ?? "").maybeSingle());
    cancelledBy = staff.full_name || staff.email;
  }
  if (!booking) return json(404, { error: "Booking not found." });
  if (booking.status === "cancelled") return json(409, { error: "This call is already cancelled." });

  const { data: cancelled, error } = await client.rpc("booking_cancel", { booking_id: booking.id, cancelled_by: cancelledBy });
  if (error) return bookingError(error);
  if (cancelled.google_event_id) {
    fetchImpl ??= googleFetch(config);
    try {
      const token = await agentAccessToken(client, config, cancelled.staff_id, fetchImpl);
      await deleteEvent(token, cancelled.google_event_id, fetchImpl);
    } catch (err) {
      // The booking is cancelled either way; the agent can delete the event by hand.
      console.error("Google event deletion failed", { message: err.message });
      return json(200, { cancelled: true, calendarUpdated: false });
    }
  }
  return json(200, { cancelled: true, calendarUpdated: true });
}

export default { fetch: (request) => handleCancel(request) };
