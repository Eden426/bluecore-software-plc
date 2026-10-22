import { createClient } from "@supabase/supabase-js";
import { hashToken, newVisitorToken } from "./chat.js";
import { GoogleAuthRevoked, accessToken, busyTimes, decryptToken } from "./google.js";
import { env, json } from "./http.js";

export const HORIZON_DAYS = 14;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const LINK_TOKEN = /^[0-9a-f]{64}$/;
export const LIMITS = { name: 120, email: 254, topic: 2000 };

export { hashToken, newVisitorToken as newCancelToken };
export const readLinkToken = (value) => (LINK_TOKEN.test(value ?? "") ? value : null);
export const readCancelToken = (value) => (/^[A-Za-z0-9_-]{43}$/.test(value ?? "") ? value : null);

export function validateBooking(input) {
  const errors = {};
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  const topic = typeof input?.topic === "string" ? input.topic.trim() : "";
  const start = Date.parse(input?.start);
  if (!name || name.length > LIMITS.name) errors.name = "Please enter your name.";
  if (!EMAIL.test(email) || email.length > LIMITS.email) errors.email = "Please enter a valid email.";
  if (!topic || topic.length > LIMITS.topic) errors.topic = "Please tell us what the call is about.";
  if (!Number.isFinite(start)) errors.start = "Please choose a time.";
  return { errors, values: { name, email, topic, start: new Date(start).toISOString() } };
}

export function serviceClient() {
  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_SECRET_KEY");
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// The signed-in staff member behind a Bearer token, or null.
export async function staffFromRequest(request, db) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user) return null;
  const { data: staff } = await db.from("staff").select("id, email, full_name, role, active").eq("id", data.user.id).single();
  return staff?.active ? staff : null;
}

// A fresh access token for an agent. If Google rejects the refresh token the
// connection is marked broken, which takes the agent out of the slot list.
export async function agentAccessToken(db, config, staffId, fetchImpl) {
  const { data: conn } = await db
    .from("calendar_connections")
    .select("refresh_token_enc, status")
    .eq("staff_id", staffId)
    .single();
  if (!conn || conn.status !== "connected") throw new GoogleAuthRevoked("Calendar not connected.");
  try {
    return await accessToken(config, decryptToken(conn.refresh_token_enc, config.tokenKey), fetchImpl);
  } catch (err) {
    if (err instanceof GoogleAuthRevoked) {
      await db.from("calendar_connections").update({ status: "broken", updated_at: new Date().toISOString() }).eq("staff_id", staffId);
    }
    throw err;
  }
}

const overlaps = (busy, start, end) => busy.some((b) => b.start < end && b.end > start);

// Free slots in [from, to): the database's candidates (weekly hours minus
// bookings) minus each agent's Google busy times. One free/busy call per
// agent covers the whole window. -> Map(startIso -> [staffId])
export async function freeSlots(db, config, fetchImpl, from, to) {
  const { data: candidates, error } = await db.rpc("booking_candidate_slots", { range_start: from, range_end: to });
  if (error) throw error;
  const byAgent = new Map();
  for (const c of candidates ?? []) {
    if (!byAgent.has(c.staff_id)) byAgent.set(c.staff_id, []);
    byAgent.get(c.staff_id).push({ start: Date.parse(c.starts_at), end: Date.parse(c.ends_at) });
  }
  const slots = new Map();
  await Promise.all(
    [...byAgent].map(async ([staffId, list]) => {
      let busy;
      try {
        const token = await agentAccessToken(db, config, staffId, fetchImpl);
        busy = await busyTimes(token, from, to, fetchImpl);
      } catch (err) {
        // One agent's calendar failing shouldn't hide everyone else's slots.
        console.error("Free/busy failed for an agent", { message: err.message });
        return;
      }
      for (const slot of list) {
        if (overlaps(busy, slot.start, slot.end)) continue;
        const key = new Date(slot.start).toISOString();
        if (!slots.has(key)) slots.set(key, []);
        slots.get(key).push(staffId);
      }
    }),
  );
  return slots;
}

export function bookingError(error) {
  if (error.code === "23P01" || error.message?.includes("slot unavailable")) {
    return json(409, { error: "That time was just taken. Please pick another." });
  }
  if (error.message?.includes("link expired")) return json(410, { error: "This booking link has expired. Ask us for a new one." });
  if (error.code === "23514") return json(400, { error: "Please check your details." });
  console.error("Booking database error", { code: error.code, message: error.message });
  return json(500, { error: "Booking is unavailable right now." });
}

export async function readJson(request, maxBytes = 16 * 1024) {
  const raw = await request.text();
  if (raw.length > maxBytes) throw new RangeError();
  return JSON.parse(raw);
}
