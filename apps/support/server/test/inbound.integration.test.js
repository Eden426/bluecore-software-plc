// @vitest-environment node
// Runs the real webhook handler against the local Supabase stack (skipped
// unless SUPABASE_URL / SUPABASE_SECRET_KEY point at it). Only Resend's API is
// faked; the signature is real Svix.
import { createClient } from "@supabase/supabase-js";
import { Webhook } from "svix";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { handleInboundEmail } from "../../api/inbound-email.js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const SECRET = "whsec_" + Buffer.from("integration-test-secret-0123456789").toString("base64");
const run = url && key ? describe : describe.skip;

// The local Docker stack can be slow to answer.
run("inbound email webhook (local Supabase)", { timeout: 30_000 }, () => {
  const db = url && createClient(url, key, { auth: { persistSession: false } });
  const emailId = `it-${Date.now()}`;
  let ticketId;

  beforeAll(() => {
    process.env.RESEND_WEBHOOK_SECRET = SECRET;
    process.env.RESEND_API_KEY = "re_test";
  });
  afterAll(async () => {
    if (ticketId) await db.from("tickets").delete().eq("id", ticketId);
  });

  function signedRequest(body, secret = SECRET) {
    const raw = JSON.stringify(body);
    const id = "msg_" + emailId;
    const timestamp = new Date();
    const signature = new Webhook(secret).sign(id, timestamp, raw);
    return new Request("http://localhost/api/inbound-email", {
      method: "POST",
      body: raw,
      headers: { "svix-id": id, "svix-timestamp": String(Math.floor(timestamp / 1000)), "svix-signature": signature },
    });
  }

  const fakeResend = async (requestUrl) => {
    expect(requestUrl).toBe(`https://api.resend.com/emails/receiving/${emailId}`);
    return Response.json({
      id: emailId,
      from: "Sara Tesfaye <sara@addislogistics.example>",
      to: ["support@blue-core.tech"],
      subject: "Garage OS invoices not printing",
      text: "Since this morning invoices fail to print.",
      html: null,
      message_id: `<${emailId}@addislogistics.example>`,
      headers: {},
    });
  };

  it("rejects a bad signature", async () => {
    const other = "whsec_" + Buffer.from("some-other-secret-0123456789abcd").toString("base64");
    const res = await handleInboundEmail(signedRequest({ type: "email.received", data: { email_id: emailId } }, other), {
      fetchImpl: fakeResend,
      supabase: db,
    });
    expect(res.status).toBe(401);
  });

  it("ignores other event types", async () => {
    const res = await handleInboundEmail(signedRequest({ type: "email.sent", data: {} }), { fetchImpl: fakeResend, supabase: db });
    expect(await res.json()).toEqual({ ignored: true });
  });

  it("creates a ticket linked to the client, and is idempotent", async () => {
    const event = { type: "email.received", data: { email_id: emailId } };
    const res = await handleInboundEmail(signedRequest(event), { fetchImpl: fakeResend, supabase: db });
    expect(res.status).toBe(200);
    const result = await res.json();
    expect(result.created).toBe(true);

    const { data: ticket } = await db
      .from("tickets")
      .select("id, subject, channel, clients(slug), ticket_messages(kind, body_text)")
      .eq("number", result.ticket)
      .single();
    ticketId = ticket.id;
    expect(ticket.subject).toBe("Garage OS invoices not printing");
    expect(ticket.channel).toBe("email");
    expect(ticket.clients.slug).toBe("addis-logistics");
    expect(ticket.ticket_messages).toEqual([{ kind: "customer", body_text: "Since this morning invoices fail to print." }]);

    const again = await handleInboundEmail(signedRequest(event), { fetchImpl: fakeResend, supabase: db });
    expect((await again.json()).created).toBe(false);
  });
});
