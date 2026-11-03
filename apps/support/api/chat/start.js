import { json } from "../../server/http.js";
import { chatError, hashToken, newVisitorToken, readJson, serviceClient, validateStart } from "../../server/chat.js";

// POST { name, email, message, pageUrl } -> { token, channelKey }
// The token is the visitor's only credential for this conversation; the
// browser keeps it and sends it as X-Chat-Token. Needs a WAF rate limit.
export async function handleStart(request, { db } = {}) {
  if (request.method !== "POST") return json(405, { error: "Method not allowed." }, { Allow: "POST" });
  let input;
  try {
    input = await readJson(request);
  } catch {
    return json(400, { error: "Invalid request." });
  }
  const { errors, values } = validateStart(input);
  if (Object.keys(errors).length) return json(400, { error: "Please check your details.", errors });

  const client = db ?? serviceClient();
  if (!client) return json(503, { error: "Chat is unavailable right now." });
  const token = newVisitorToken();
  const { data, error } = await client.rpc("chat_visitor_start", {
    token_hash: hashToken(token),
    visitor_name: values.name,
    visitor_email: values.email,
    body: values.message,
    page_url: values.pageUrl,
  });
  if (error) return chatError(error);
  return json(201, { token, channelKey: data.channel_key });
}

export default { fetch: (request) => handleStart(request) };
