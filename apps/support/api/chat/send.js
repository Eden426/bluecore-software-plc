import { json } from "../../server/http.js";
import { chatError, hashToken, readJson, readToken, serviceClient, validBody } from "../../server/chat.js";

// POST { body } with X-Chat-Token -> { id }
export async function handleSend(request, { db } = {}) {
  if (request.method !== "POST") return json(405, { error: "Method not allowed." }, { Allow: "POST" });
  const token = readToken(request);
  if (!token) return json(401, { error: "Missing chat token." });
  let body;
  try {
    body = validBody(await readJson(request));
  } catch {
    return json(400, { error: "Invalid request." });
  }
  if (!body) return json(400, { error: "Messages can be up to 4,000 characters." });

  const client = db ?? serviceClient();
  if (!client) return json(503, { error: "Chat is unavailable right now." });
  const { data, error } = await client.rpc("chat_visitor_send", { token_hash: hashToken(token), body });
  if (error) return chatError(error);
  return json(201, { id: data.id });
}

export default { fetch: (request) => handleSend(request) };
