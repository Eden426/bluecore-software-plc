import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { env, json } from "./http.js";

// Visitor tokens: 32 random bytes, base64url. Only the SHA-256 hex is stored.
export const newVisitorToken = () => randomBytes(32).toString("base64url");
export const hashToken = (token) => createHash("sha256").update(token).digest("hex");
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const LIMITS = { name: 120, email: 254, body: 4000, pageUrl: 500 };

export function readToken(request) {
  const token = request.headers.get("x-chat-token") ?? "";
  return TOKEN.test(token) ? token : null;
}

export function validateStart(input) {
  const errors = {};
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  const message = typeof input?.message === "string" ? input.message.trim() : "";
  if (!name || name.length > LIMITS.name) errors.name = "Please enter your name.";
  if (!EMAIL.test(email) || email.length > LIMITS.email) errors.email = "Please enter a valid email.";
  if (!message || message.length > LIMITS.body) errors.message = "Please enter a message (up to 4,000 characters).";
  const pageUrl = typeof input?.pageUrl === "string" ? input.pageUrl.slice(0, LIMITS.pageUrl) : "";
  return { errors, values: { name, email, message, pageUrl } };
}

export function validBody(input) {
  const body = typeof input?.body === "string" ? input.body.trim() : "";
  return body && body.length <= LIMITS.body ? body : null;
}

export function serviceClient() {
  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_SECRET_KEY");
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Map database errors from the chat_visitor_* functions to responses.
export function chatError(error) {
  if (error.code === "P0002") return json(404, { error: "This chat has ended. Start a new one." });
  if (error.message?.includes("closed")) return json(409, { error: "This chat has been closed." });
  if (error.message?.includes("limit")) return json(429, { error: "This chat is too long. Please email us instead." });
  if (error.code === "23514") return json(400, { error: "Invalid request." });
  console.error("Chat database error", { code: error.code });
  return json(500, { error: "Chat is unavailable right now." });
}

export async function readJson(request, maxBytes = 16 * 1024) {
  const raw = await request.text();
  if (raw.length > maxBytes) throw new RangeError();
  return JSON.parse(raw);
}
