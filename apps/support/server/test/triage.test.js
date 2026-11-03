// @vitest-environment node
import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { handleTriage } from "../../api/tickets/triage.js";
import { DEFAULT_MODEL, TRIAGE_SCHEMA, askClaude, buildPrompt, fakeTriage } from "../triage.js";

const ticket = { subject: "Invoices fail to sync", channel: "email", requester_name: "Dawit", clients: { name: "Addis Logistics" } };
const products = [{ id: "p1", slug: "ledger", name: "Ledger", description: "Accounting" }];

function claude(result, extra = {}) {
  const create = vi.fn(async () => ({
    stop_reason: "end_turn",
    content: [{ type: "text", text: JSON.stringify(result) }],
    ...extra,
  }));
  return { create, client: { beta: { messages: { create } } } };
}

describe("buildPrompt", () => {
  it("includes customer messages only, and the product list", () => {
    const prompt = buildPrompt(ticket, [
      { kind: "customer", body_text: "Sync has failed since Monday.", created_at: "2026-11-01T10:00:00Z" },
      { kind: "note", body_text: "Internal: VIP client", created_at: "2026-11-01T11:00:00Z" },
      { kind: "agent", body_text: "Looking into it", created_at: "2026-11-01T12:00:00Z" },
    ], products);
    expect(prompt).toContain("Sync has failed since Monday.");
    expect(prompt).toContain("- ledger: Ledger (Accounting)");
    expect(prompt).toContain('client="Addis Logistics"');
    expect(prompt).not.toContain("VIP client");
    expect(prompt).not.toContain("Looking into it");
  });

  it("caps how much ticket text is sent", () => {
    const long = { kind: "customer", body_text: "x".repeat(50_000), created_at: "t" };
    expect(buildPrompt(ticket, [long, long], products).length).toBeLessThan(13_000);
  });
});

describe("askClaude", () => {
  it("asks for schema-shaped JSON with fallbacks on, at low effort", async () => {
    const { create, client } = claude({ priority: "high" });
    expect(await askClaude({ model: DEFAULT_MODEL }, "prompt", client)).toEqual({ priority: "high" });
    const body = create.mock.calls[0][0];
    expect(body.model).toBe("claude-opus-5-5");
    expect(body.fallbacks).toBe("default");
    expect(body.betas).toEqual(["server-side-fallback-2026-07-01"]);
    expect(body.output_config).toEqual({ effort: "low", format: { type: "json_schema", schema: TRIAGE_SCHEMA } });
    expect(body.thinking).toBeUndefined();
  });

  it("treats refusals and truncation as failures", async () => {
    await expect(askClaude({ model: "m" }, "p", claude({}, { stop_reason: "refusal", content: [] }).client)).rejects.toThrow(/declined/);
    await expect(askClaude({ model: "m" }, "p", claude({}, { stop_reason: "max_tokens" }).client)).rejects.toThrow(/cut off/);
  });
});

describe("fakeTriage", () => {
  it("flags outages as urgent and matches products by name", () => {
    const r = fakeTriage({ subject: "Ledger is down" }, [], products);
    expect(r.priority).toBe("urgent");
    expect(r.product_slug).toBe("ledger");
  });
});

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const run = url && key ? describe : describe.skip;

run("triage API (local Supabase)", { timeout: 30_000 }, () => {
  const db = url && createClient(url, key, { auth: { persistSession: false } });
  const anon = url && createClient(url, process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? key, { auth: { persistSession: false } });
  let agentToken;
  let viewerToken;
  const users = [];
  let ticketId;
  let productId;

  async function login(role) {
    const email = `triage-${role}-${Date.now()}@ai.test`;
    const { data } = await db.auth.admin.createUser({ email, password: "pw-123456789", email_confirm: true });
    users.push(data.user.id);
    await db.from("staff").update({ role }).eq("id", data.user.id);
    const { data: session } = await anon.auth.signInWithPassword({ email, password: "pw-123456789" });
    return session.session.access_token;
  }

  beforeAll(async () => {
    agentToken = await login("agent");
    viewerToken = await login("viewer");
    const { data: product } = await db.from("products").insert({ name: "Triage Ledger", slug: `triage-ledger-${Date.now()}`, kind: "shared" }).select().single();
    productId = product.id;
    const { data: t } = await db.from("tickets").insert({ subject: "Payroll export fails", requester_email: "c@example.test" }).select().single();
    ticketId = t.id;
    await db.from("ticket_messages").insert({ ticket_id: ticketId, kind: "customer", body_text: "Triage Ledger payroll export errors out." });
  });

  afterAll(async () => {
    if (ticketId) await db.from("tickets").delete().eq("id", ticketId);
    if (productId) await db.from("products").delete().eq("id", productId);
    for (const id of users) await db.auth.admin.deleteUser(id);
  });

  const post = (token, body) =>
    new Request("http://x/api/tickets/triage", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  it("stores Claude's suggestion, keeping only known products and tidy tags", async () => {
    const product = (await db.from("products").select("slug").eq("id", productId).single()).data;
    const { client } = claude({
      priority: "high", product_slug: product.slug, category: "Bug", tags: ["Payroll Export", "payroll export", "x y"],
      summary: "Payroll export fails.", suggested_reply: "Hi,", reasoning: "Blocks payroll.",
    });
    const res = await handleTriage(post(agentToken, { ticket_id: ticketId }), { db, config: { fake: false, model: "test-model" }, anthropic: client });
    expect(res.status).toBe(200);
    const { triage } = await res.json();
    expect(triage).toMatchObject({ priority: "high", product_id: productId, category: "bug", tags: ["payroll-export", "x-y"], status: "suggested", model: "test-model" });
  });

  it("ignores a product Claude made up", async () => {
    const { client } = claude({ priority: "low", product_slug: "nope", category: "", tags: [], summary: "", suggested_reply: "", reasoning: "" });
    const res = await handleTriage(post(agentToken, { ticket_id: ticketId }), { db, config: { fake: false, model: "m" }, anthropic: client });
    expect((await res.json()).triage.product_id).toBeNull();
  });

  it("refuses viewers and anonymous callers", async () => {
    const config = { fake: true, model: "fake" };
    expect((await handleTriage(post(viewerToken, { ticket_id: ticketId }), { db, config })).status).toBe(403);
    expect((await handleTriage(post("nope", { ticket_id: ticketId }), { db, config })).status).toBe(401);
  });

  it("reports a Claude failure without leaking details", async () => {
    const client = { beta: { messages: { create: vi.fn(async () => { throw new Error("overloaded"); }) } } };
    const res = await handleTriage(post(agentToken, { ticket_id: ticketId }), { db, config: { fake: false, model: "m" }, anthropic: client });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("AI triage is unavailable right now.");
  });
});
