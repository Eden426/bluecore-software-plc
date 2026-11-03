import { serviceClient, staffFromRequest } from "../../server/booking.js";
import { json } from "../../server/http.js";
import { triageConfig, triageTicket } from "../../server/triage.js";

const ROLES = ["agent", "admin"];

// POST { ticket_id } with an agent's Bearer token: (re)runs AI triage for the
// ticket and returns the stored suggestion. Agents apply or dismiss it
// through apply_ai_triage()/decide_ai_triage() as themselves.
export async function handleTriage(request, { db, config, anthropic } = {}) {
  if (request.method !== "POST") return json(405, { error: "Method not allowed." }, { Allow: "POST" });
  db ??= serviceClient();
  config ??= triageConfig();
  if (!db || !config) return json(503, { error: "AI triage is not configured." });

  const staff = await staffFromRequest(request, db);
  if (!staff) return json(401, { error: "Sign in required." });
  if (!ROLES.includes(staff.role)) return json(403, { error: "Only agents can run triage." });

  let input;
  try {
    input = await request.json();
  } catch {
    return json(400, { error: "Invalid request." });
  }
  if (typeof input?.ticket_id !== "string" || !/^[0-9a-f-]{36}$/i.test(input.ticket_id)) {
    return json(400, { error: "Invalid request." });
  }

  try {
    return json(200, { triage: await triageTicket(db, config, input.ticket_id, { anthropic }) });
  } catch (err) {
    if (err.status === 404) return json(404, { error: "Ticket not found." });
    // Never log ticket content.
    console.error("AI triage failed", { message: err.message });
    return json(502, { error: "AI triage is unavailable right now." });
  }
}

export default { fetch: (request) => handleTriage(request) };
