import { serviceClient, staffFromRequest } from "../../server/booking.js";
import { decryptToken, googleConfig } from "../../server/google.js";
import { json } from "../../server/http.js";

// POST with the agent's Bearer token: forget their Google connection and
// revoke it at Google (best effort). Booked calls stay on their calendar.
export async function handleDisconnect(request, { db, config, fetchImpl = fetch } = {}) {
  if (request.method !== "POST") return json(405, { error: "Method not allowed." }, { Allow: "POST" });
  config ??= googleConfig();
  const client = db ?? serviceClient();
  if (!client || !config) return json(503, { error: "Google Calendar is not configured." });
  const staff = await staffFromRequest(request, client);
  if (!staff) return json(401, { error: "Sign in required." });
  const { data: conn } = await client.from("calendar_connections").select("refresh_token_enc").eq("staff_id", staff.id).maybeSingle();
  await client.from("calendar_connections").delete().eq("staff_id", staff.id);
  if (conn && !config.fake) {
    try {
      const token = decryptToken(conn.refresh_token_enc, config.tokenKey);
      await fetchImpl(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST" });
    } catch {
      // Already revoked or unreachable; the stored token is gone regardless.
    }
  }
  return json(200, { disconnected: true });
}

export default { fetch: (request) => handleDisconnect(request) };
