import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { env } from "./http.js";

// Google Calendar over plain REST (no SDK): OAuth for each agent, free/busy
// for availability, and events with Meet links for bookings.
//
// Scopes: calendar.events (create/delete the call) and calendar.freebusy
// (busy times only, no event details), plus openid email to show which
// account is connected.
export const SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
];
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/calendar/v3";

export class GoogleAuthRevoked extends Error {}

export function googleConfig() {
  const fake = env("GOOGLE_CALENDAR_TRANSPORT") === "fake";
  const config = {
    fake,
    clientId: fake ? "fake-client" : env("GOOGLE_CLIENT_ID"),
    clientSecret: fake ? "fake-secret" : env("GOOGLE_CLIENT_SECRET"),
    redirectUri: env("GOOGLE_REDIRECT_URI"),
    tokenKey: env("GOOGLE_TOKEN_KEY"),
  };
  const ready = config.clientId && config.clientSecret && config.redirectUri && config.tokenKey;
  return ready ? config : null;
}

// --- secrets ---------------------------------------------------------------

// GOOGLE_TOKEN_KEY is any long random string; separate keys are derived for
// encrypting refresh tokens and for signing OAuth state.
const derive = (secret, purpose) => createHash("sha256").update(`${purpose}:${secret}`).digest();

export function encryptToken(plain, secret) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", derive(secret, "token"), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function decryptToken(sealed, secret) {
  const [iv, tag, data] = sealed.split(".").map((p) => Buffer.from(p, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", derive(secret, "token"), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

// OAuth state: the callback has no session, so the signed state is what ties
// it to the agent who started the flow. Valid for 10 minutes.
export function signState(staffId, secret, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ s: staffId, e: now + 10 * 60_000 })).toString("base64url");
  const mac = createHmac("sha256", derive(secret, "state")).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

export function verifyState(state, secret, now = Date.now()) {
  const [payload, mac] = String(state ?? "").split(".");
  if (!payload || !mac) return null;
  const expected = createHmac("sha256", derive(secret, "state")).update(payload).digest();
  const given = Buffer.from(mac, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const { s, e } = JSON.parse(Buffer.from(payload, "base64url").toString());
  return e > now && typeof s === "string" ? s : null;
}

// --- OAuth -----------------------------------------------------------------

export function authorizationUrl(config, state) {
  if (config.fake) {
    // Local stand-in for Google's consent screen: straight back to the callback.
    return `${config.redirectUri}?${new URLSearchParams({ code: "fake-code", state })}`;
  }
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    // Offline + consent so Google always returns a refresh token.
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${params}`;
}

async function tokenRequest(fetchImpl, body) {
  const response = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const data = await response.json().catch(() => ({}));
  if (data.error === "invalid_grant") throw new GoogleAuthRevoked("Google access was revoked or expired.");
  if (!response.ok) throw new Error(`Google token request failed (${response.status})`);
  return data;
}

// -> { refreshToken, email }
export async function exchangeCode(config, code, fetchImpl) {
  const data = await tokenRequest(fetchImpl, {
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });
  if (!data.refresh_token) throw new Error("Google did not return a refresh token.");
  const missing = SCOPES.filter((s) => s.startsWith("https://") && !String(data.scope ?? "").includes(s));
  if (missing.length) throw new Error("Calendar access was not granted.");
  // The id_token came straight from Google over TLS, so its claims can be read without verifying the signature.
  const claims = JSON.parse(Buffer.from(String(data.id_token ?? "").split(".")[1] ?? "e30", "base64url").toString());
  return { refreshToken: data.refresh_token, email: claims.email ?? "" };
}

export async function accessToken(config, refreshToken, fetchImpl) {
  const data = await tokenRequest(fetchImpl, {
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
  });
  return data.access_token;
}

// --- Calendar --------------------------------------------------------------

async function call(fetchImpl, token, path, init = {}) {
  const response = await fetchImpl(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
  });
  if (response.status === 401) throw new GoogleAuthRevoked("Google access was revoked.");
  if (!response.ok && !(init.method === "DELETE" && [404, 410].includes(response.status))) {
    throw new Error(`Google Calendar request failed (${response.status})`);
  }
  return response.status === 204 || init.method === "DELETE" ? null : response.json();
}

// Busy intervals on the agent's primary calendar: [{ start, end }] in ms.
export async function busyTimes(token, timeMin, timeMax, fetchImpl) {
  const data = await call(fetchImpl, token, "/freeBusy", {
    method: "POST",
    body: JSON.stringify({ timeMin, timeMax, items: [{ id: "primary" }] }),
  });
  const calendar = data.calendars?.primary;
  if (calendar?.errors?.length) throw new Error("Google free/busy returned an error.");
  return (calendar?.busy ?? []).map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end) }));
}

// Creates the call on the agent's calendar, invites the customer (Google
// emails them the invite) and asks for a Meet link. conferenceDataVersion=1 is
// required, or Google silently ignores the createRequest.
export async function createEvent(token, { bookingId, summary, description, start, end, attendee }, fetchImpl) {
  const query = new URLSearchParams({ conferenceDataVersion: "1", sendUpdates: "all" });
  const event = await call(fetchImpl, token, `/calendars/primary/events?${query}`, {
    method: "POST",
    body: JSON.stringify({
      summary,
      description,
      start: { dateTime: start },
      end: { dateTime: end },
      attendees: [attendee],
      conferenceData: {
        createRequest: { requestId: bookingId, conferenceSolutionKey: { type: "hangoutsMeet" } },
      },
      reminders: { useDefault: true },
    }),
  });
  const meet = event.hangoutLink ?? event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ?? null;
  return { id: event.id, meetUrl: meet };
}

export async function deleteEvent(token, eventId, fetchImpl) {
  const query = new URLSearchParams({ sendUpdates: "all" });
  await call(fetchImpl, token, `/calendars/primary/events/${encodeURIComponent(eventId)}?${query}`, { method: "DELETE" });
}

// --- Local fake --------------------------------------------------------------

// GOOGLE_CALENDAR_TRANSPORT=fake: answers the same requests as Google so the
// whole flow runs locally. Calendars are always free; events are logged.
export async function fakeGoogleFetch(url, init = {}) {
  const u = new URL(url);
  if (u.href === TOKEN_URL) {
    const idToken = `e30.${Buffer.from(JSON.stringify({ email: "agent@gmail.test" })).toString("base64url")}.sig`;
    return Response.json({
      access_token: "fake-access",
      refresh_token: "fake-refresh",
      id_token: idToken,
      scope: SCOPES.join(" "),
    });
  }
  if (u.pathname.endsWith("/freeBusy")) return Response.json({ calendars: { primary: { busy: [] } } });
  if (init.method === "DELETE") {
    console.info("[support] fake Google: event deleted", u.pathname.split("/").pop());
    return new Response(null, { status: 204 });
  }
  const body = JSON.parse(init.body);
  console.info("[support] fake Google: event created", { summary: body.summary, start: body.start.dateTime });
  const code = randomUUID().slice(0, 12).replace(/-/g, "");
  return Response.json({ id: `fake_${code}`, hangoutLink: `https://meet.google.com/fake-${code}` });
}

export const googleFetch = (config) => (config.fake ? fakeGoogleFetch : fetch);
