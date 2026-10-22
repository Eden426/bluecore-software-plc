import { serviceClient, staffFromRequest } from "../../server/booking.js";
import { authorizationUrl, googleConfig, signState } from "../../server/google.js";
import { json } from "../../server/http.js";

// POST with the agent's Bearer token -> { url } to Google's consent screen.
export async function handleConnect(request, { db, config } = {}) {
  if (request.method !== "POST") return json(405, { error: "Method not allowed." }, { Allow: "POST" });
  config ??= googleConfig();
  const client = db ?? serviceClient();
  if (!client || !config) return json(503, { error: "Google Calendar is not configured." });
  const staff = await staffFromRequest(request, client);
  if (!staff) return json(401, { error: "Sign in required." });
  if (!["agent", "admin"].includes(staff.role)) return json(403, { error: "Only agents can take bookings." });
  return json(200, { url: authorizationUrl(config, signState(staff.id, config.tokenKey)) });
}

export default { fetch: (request) => handleConnect(request) };
