// @vitest-environment node
// Runs the visitor chat endpoints against the local Supabase stack (skipped
// unless SUPABASE_URL / SUPABASE_SECRET_KEY are set, e.g. via .env.local).
import { createClient } from "@supabase/supabase-js";
import { afterAll, describe, expect, it } from "vitest";
import { handleMessages } from "../../api/chat/messages.js";
import { handleSend } from "../../api/chat/send.js";
import { handleStart } from "../../api/chat/start.js";
import { hashToken } from "../chat.js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const run = url && key ? describe : describe.skip;

run("visitor chat API (local Supabase)", { timeout: 30_000 }, () => {
  const db = url && createClient(url, key, { auth: { persistSession: false } });
  let token;

  afterAll(async () => {
    if (token) await db.from("chat_conversations").delete().eq("token_hash", hashToken(token));
  });

  const post = (path, body, headers = {}) =>
    new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

  it("validates the start form", async () => {
    const res = await handleStart(post("/api/chat/start", { name: "", email: "nope", message: "" }), { db });
    expect(res.status).toBe(400);
    expect(Object.keys((await res.json()).errors).sort()).toEqual(["email", "message", "name"]);
  });

  it("starts a chat, sends, and reads back by token only", async () => {
    const started = await handleStart(
      post("/api/chat/start", { name: "Hana", email: "hana@addislogistics.example", message: "Hello there", pageUrl: "/kb" }),
      { db },
    );
    expect(started.status).toBe(201);
    ({ token } = await started.json());
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const { data: stored } = await db.from("chat_conversations").select("token_hash, clients(slug)").eq("token_hash", hashToken(token)).single();
    expect(stored.clients.slug).toBe("addis-logistics");

    expect((await handleSend(post("/api/chat/send", { body: "Are you there?" }, { "x-chat-token": token }), { db })).status).toBe(201);

    const read = await handleMessages(new Request("http://localhost/api/chat/messages?after=0", { headers: { "x-chat-token": token } }), { db });
    const result = await read.json();
    expect(result.status).toBe("waiting");
    expect(result.messages.map((m) => m.body)).toEqual(["Hello there", "Are you there?"]);

    const later = await handleMessages(
      new Request(`http://localhost/api/chat/messages?after=${result.messages[0].id}`, { headers: { "x-chat-token": token } }),
      { db },
    );
    expect((await later.json()).messages).toHaveLength(1);
  });

  it("rejects missing or unknown tokens", async () => {
    expect((await handleMessages(new Request("http://localhost/api/chat/messages"), { db })).status).toBe(401);
    const unknown = "A".repeat(43);
    expect((await handleMessages(new Request("http://localhost/api/chat/messages", { headers: { "x-chat-token": unknown } }), { db })).status).toBe(404);
  });
});
