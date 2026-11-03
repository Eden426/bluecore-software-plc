import { createClient } from "@supabase/supabase-js";
import { Webhook } from "svix";
import { toIngestPayload } from "../server/email.js";
import { env, json } from "../server/http.js";

const MAX_BYTES = 256 * 1024;

// Resend `email.received` webhook -> new ticket or reply on an existing one.
// The webhook only carries metadata, so the body and headers are fetched from
// Resend's Received Emails API before handing off to ingest_inbound_email().
// Non-2xx responses make Resend retry; ingestion is idempotent per email id.
export async function handleInboundEmail(request, { fetchImpl = fetch, supabase } = {}) {
  if (request.method !== "POST") return json(405, { error: "Method not allowed." }, { Allow: "POST" });

  const secret = env("RESEND_WEBHOOK_SECRET");
  const apiKey = env("RESEND_API_KEY");
  if (!secret || !apiKey) return json(503, { error: "Inbound email is not configured." });

  const raw = await request.text();
  if (raw.length > MAX_BYTES) return json(413, { error: "Payload too large." });

  let event;
  try {
    // Must verify the raw body: re-serialised JSON breaks the signature.
    event = new Webhook(secret).verify(raw, {
      "svix-id": request.headers.get("svix-id") ?? "",
      "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
      "svix-signature": request.headers.get("svix-signature") ?? "",
    });
  } catch {
    return json(401, { error: "Invalid signature." });
  }

  // Acknowledge other event types so Resend doesn't retry them.
  if (event?.type !== "email.received") return json(200, { ignored: true });
  const emailId = event.data?.email_id;
  if (typeof emailId !== "string" || !emailId) return json(400, { error: "Missing email id." });

  let received;
  try {
    const response = await fetchImpl(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error("Resend received-email fetch failed", { status: response.status });
      return json(502, { error: "Could not fetch email." });
    }
    received = await response.json();
  } catch {
    console.error("Resend received-email fetch unavailable");
    return json(502, { error: "Could not fetch email." });
  }

  const db = supabase ?? serviceClient();
  if (!db) return json(503, { error: "Database is not configured." });
  const { data, error } = await db.rpc("ingest_inbound_email", { payload: toIngestPayload(received) });
  if (error) {
    // Never log email content or addresses.
    console.error("Inbound email ingestion failed", { code: error.code });
    return json(error.code === "23514" ? 422 : 500, { error: "Could not record email." });
  }
  return json(200, { ticket: data.number, created: data.created });
}

function serviceClient() {
  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_SECRET_KEY");
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export default { fetch: (request) => handleInboundEmail(request) };
