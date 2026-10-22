// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleReply } from "../../api/tickets/reply.js";

// Minimal chainable stand-in for the supabase-js query builder.
function query(result) {
  const q = {};
  for (const m of ["select", "eq", "not", "order", "insert", "update", "delete"]) q[m] = vi.fn(() => q);
  q.single = vi.fn(async () => result);
  q.then = (resolve) => resolve(result);
  return q;
}

const TICKET = { id: "t1", number: 1042, subject: "Printer", requester_email: "sara@addis.example", reply_token: "tok", status: "open" };

function makeClients({ insertError = null } = {}) {
  const deletes = query({ error: null });
  const updates = query({ error: null });
  const asUser = {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "agent-1" } }, error: null })) },
    from: vi.fn((table) => {
      if (table === "staff") return query({ data: { full_name: "Aman", email: "aman@blue-core.tech" } });
      if (table === "tickets") return query({ data: TICKET, error: null });
      return query(insertError ? { data: null, error: insertError } : { data: { id: "m1", body_text: "Fixed" }, error: null });
    }),
  };
  const service = {
    from: vi.fn(() => ({
      select: () => query({ data: [{ email_message_id: "<orig@addis.example>" }] }),
      update: updates.update,
      delete: deletes.delete,
    })),
  };
  return { asUser, service, updates, deletes };
}

function request(body = { ticket_id: "t1", body: "Fixed" }) {
  return new Request("http://localhost/api/tickets/reply", {
    method: "POST",
    headers: { authorization: "Bearer user-token", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  process.env.RESEND_API_KEY = "re_test";
  process.env.SUPPORT_ADDRESS = "support@blue-core.tech";
  process.env.SUPPORT_FROM_ADDRESS = "support@mail.blue-core.tech";
});

describe("ticket reply API", () => {
  it("requires a bearer token", async () => {
    const res = await handleReply(new Request("http://localhost", { method: "POST", body: "{}" }));
    expect(res.status).toBe(401);
  });

  it("saves the reply, emails it threaded, and stamps the message ids", async () => {
    const clients = makeClients();
    const fetchImpl = vi.fn(async () => Response.json({ id: "re_sent" }));
    const res = await handleReply(request(), { fetchImpl, clients });
    expect(res.status).toBe(201);
    const sent = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(sent.to).toEqual(["sara@addis.example"]);
    expect(sent.headers["In-Reply-To"]).toBe("<orig@addis.example>");
    expect(fetchImpl.mock.calls[0][1].headers["Idempotency-Key"]).toBe("ticket-reply-m1");
    expect(clients.updates.update).toHaveBeenCalledWith(
      expect.objectContaining({ resend_email_id: "re_sent", email_message_id: sent.headers["Message-ID"] }),
    );
  });

  it("removes the message when the email can't be sent", async () => {
    const clients = makeClients();
    const res = await handleReply(request(), { fetchImpl: async () => new Response("nope", { status: 500 }), clients });
    expect(res.status).toBe(502);
    expect(clients.deletes.delete).toHaveBeenCalled();
  });

  it("returns 403 when RLS rejects the reply", async () => {
    const clients = makeClients({ insertError: { code: "42501" } });
    const fetchImpl = vi.fn();
    const res = await handleReply(request(), { fetchImpl, clients });
    expect(res.status).toBe(403);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
