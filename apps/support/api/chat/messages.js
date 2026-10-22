import { json } from "../../server/http.js";
import { chatError, hashToken, readToken, serviceClient } from "../../server/chat.js";

// GET ?after=<message id> with X-Chat-Token -> { status, ticketNumber, messages }
export async function handleMessages(request, { db } = {}) {
  if (request.method !== "GET") return json(405, { error: "Method not allowed." }, { Allow: "GET" });
  const token = readToken(request);
  if (!token) return json(401, { error: "Missing chat token." });
  const after = Number.parseInt(new URL(request.url).searchParams.get("after") ?? "0", 10);

  const client = db ?? serviceClient();
  if (!client) return json(503, { error: "Chat is unavailable right now." });
  const { data, error } = await client.rpc("chat_visitor_messages", {
    token_hash: hashToken(token),
    after_id: Number.isFinite(after) && after > 0 ? after : 0,
  });
  if (error) return chatError(error);
  return json(200, {
    status: data.status,
    channelKey: data.channel_key,
    ticketNumber: data.ticket_number,
    messages: data.messages,
  });
}

export default { fetch: (request) => handleMessages(request) };
