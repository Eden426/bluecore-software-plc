import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { buildReplyEmail } from "../../server/email.js";
import { env, json } from "../../server/http.js";

const MAX_BODY = 20_000;

// POST { ticket_id, body } with the agent's Supabase access token as a Bearer
// token. The message is inserted *as the agent* (so RLS decides whether they
// may reply), then emailed to the requester via Resend and stamped with the
// sent ids using the service role. If sending fails the message is removed, so
// the thread never shows a reply the customer didn't get.
// Local development only: SUPPORT_EMAIL_TRANSPORT=log records replies without
// calling Resend, logging the would-be email instead.
async function logTransport(_url, init) {
  const email = JSON.parse(init.body);
  console.info("[support] email not sent (SUPPORT_EMAIL_TRANSPORT=log)", { to: email.to, subject: email.subject });
  return Response.json({ id: `log-${Date.now()}` });
}

export async function handleReply(request, { fetchImpl, clients } = {}) {
  const logOnly = env("SUPPORT_EMAIL_TRANSPORT") === "log";
  fetchImpl ??= logOnly ? logTransport : fetch;
  if (request.method !== "POST") return json(405, { error: "Method not allowed." }, { Allow: "POST" });
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return json(401, { error: "Sign in required." });

  let input;
  try {
    input = await request.json();
  } catch {
    return json(400, { error: "Invalid request." });
  }
  const body = typeof input?.body === "string" ? input.body.trim() : "";
  if (typeof input?.ticket_id !== "string" || !body || body.length > MAX_BODY) {
    return json(400, { error: "A reply needs a ticket and some text." });
  }

  const config = {
    supportAddress: env("SUPPORT_ADDRESS"),
    fromAddress: env("SUPPORT_FROM_ADDRESS"),
  };
  const apiKey = logOnly ? "unused" : env("RESEND_API_KEY");
  const { asUser, service } = clients ?? makeClients(token);
  if (!asUser || !service || !apiKey || !config.supportAddress || !config.fromAddress) {
    return json(503, { error: "Email replies are not configured." });
  }

  const { data: userData, error: userError } = await asUser.auth.getUser(token);
  if (userError || !userData?.user) return json(401, { error: "Sign in required." });
  const userId = userData.user.id;

  const { data: staff } = await asUser.from("staff").select("full_name, email").eq("id", userId).single();
  const { data: ticket, error: ticketError } = await asUser
    .from("tickets")
    .select("id, number, subject, requester_email, reply_token, status")
    .eq("id", input.ticket_id)
    .single();
  if (ticketError || !ticket) return json(404, { error: "Ticket not found." });
  if (ticket.status === "closed") return json(409, { error: "Closed tickets can't be replied to." });

  const { data: message, error: insertError } = await asUser
    .from("ticket_messages")
    .insert({
      ticket_id: ticket.id,
      kind: "agent",
      author_staff_id: userId,
      author_email: staff?.email ?? "",
      author_name: staff?.full_name ?? "",
      body_text: body,
    })
    .select()
    .single();
  if (insertError) {
    return json(insertError.code === "42501" ? 403 : 500, {
      error: insertError.code === "42501" ? "You don't have permission to reply." : "Could not save the reply.",
    });
  }

  // Thread the email onto every Message-ID we know for this ticket.
  const { data: previous } = await service
    .from("ticket_messages")
    .select("email_message_id")
    .eq("ticket_id", ticket.id)
    .not("email_message_id", "is", null)
    .order("created_at");
  const threadIds = (previous ?? []).map((m) => m.email_message_id).slice(-10);
  const messageId = `<${randomUUID()}@${config.fromAddress.split("@")[1]}>`;
  const email = buildReplyEmail({
    ticket,
    message,
    agentName: staff?.full_name || "Bluecore Support",
    threadIds,
    config,
    messageId,
  });

  try {
    const response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `ticket-reply-${message.id}`,
      },
      body: JSON.stringify(email),
    });
    if (!response.ok) throw new Error(`Resend responded ${response.status}`);
    const sent = await response.json();
    await service
      .from("ticket_messages")
      .update({ email_message_id: messageId, resend_email_id: sent.id ?? null })
      .eq("id", message.id);
    return json(201, { message: { ...message, email_message_id: messageId } });
  } catch {
    console.error("Ticket reply email failed");
    await service.from("ticket_messages").delete().eq("id", message.id);
    return json(502, { error: "The reply couldn't be emailed, so it wasn't saved. Try again." });
  }
}

function makeClients(token) {
  const url = env("SUPABASE_URL");
  const publishable = env("SUPABASE_PUBLISHABLE_KEY");
  const secret = env("SUPABASE_SECRET_KEY");
  if (!url || !publishable || !secret) return {};
  const opts = { auth: { persistSession: false, autoRefreshToken: false } };
  return {
    asUser: createClient(url, publishable, { ...opts, global: { headers: { Authorization: `Bearer ${token}` } } }),
    service: createClient(url, secret, opts),
  };
}

export default { fetch: (request) => handleReply(request) };
