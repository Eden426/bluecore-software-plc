// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  GoogleAuthRevoked,
  accessToken,
  authorizationUrl,
  busyTimes,
  createEvent,
  decryptToken,
  encryptToken,
  exchangeCode,
  signState,
  verifyState,
} from "../google.js";

const config = { clientId: "cid", clientSecret: "secret", redirectUri: "https://support.test/api/google/callback", tokenKey: "k".repeat(40) };

describe("Google Calendar helpers", () => {
  it("encrypts refresh tokens reversibly and detects tampering", () => {
    const sealed = encryptToken("1//refresh", config.tokenKey);
    expect(sealed).not.toContain("refresh");
    expect(decryptToken(sealed, config.tokenKey)).toBe("1//refresh");
    expect(() => decryptToken(sealed, "other-key".repeat(5))).toThrow();
  });

  it("signs OAuth state for one staff member, with an expiry", () => {
    const state = signState("staff-1", config.tokenKey, 1_000);
    expect(verifyState(state, config.tokenKey, 2_000)).toBe("staff-1");
    expect(verifyState(state, config.tokenKey, 1_000 + 11 * 60_000)).toBeNull();
    expect(verifyState(state.replace(/.$/, (c) => (c === "A" ? "B" : "A")), config.tokenKey, 2_000)).toBeNull();
    expect(verifyState("garbage", config.tokenKey)).toBeNull();
  });

  it("asks for offline access with the calendar scopes", () => {
    const url = new URL(authorizationUrl(config, "st"));
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("scope")).toContain("https://www.googleapis.com/auth/calendar.freebusy");
    expect(url.searchParams.get("scope")).toContain("https://www.googleapis.com/auth/calendar.events");
  });

  it("exchanges the code and reads the account email", async () => {
    const idToken = `h.${Buffer.from(JSON.stringify({ email: "sara@gmail.test" })).toString("base64url")}.s`;
    const fetchImpl = vi.fn(async () =>
      Response.json({
        refresh_token: "r1",
        id_token: idToken,
        scope: "openid https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy",
      }),
    );
    expect(await exchangeCode(config, "code1", fetchImpl)).toEqual({ refreshToken: "r1", email: "sara@gmail.test" });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://oauth2.googleapis.com/token");
    expect(Object.fromEntries(new URLSearchParams(init.body))).toMatchObject({ code: "code1", grant_type: "authorization_code" });
  });

  it("rejects a consent that left out calendar access", async () => {
    const fetchImpl = async () => Response.json({ refresh_token: "r1", scope: "openid email" });
    await expect(exchangeCode(config, "c", fetchImpl)).rejects.toThrow("not granted");
  });

  it("reports revoked refresh tokens distinctly", async () => {
    const fetchImpl = async () => Response.json({ error: "invalid_grant" }, { status: 400 });
    await expect(accessToken(config, "r1", fetchImpl)).rejects.toBeInstanceOf(GoogleAuthRevoked);
  });

  it("queries free/busy on the primary calendar", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ calendars: { primary: { busy: [{ start: "2027-11-01T09:00:00Z", end: "2027-11-01T09:20:00Z" }] } } }),
    );
    const busy = await busyTimes("at", "2027-11-01T00:00:00Z", "2027-11-02T00:00:00Z", fetchImpl);
    expect(busy).toEqual([{ start: Date.parse("2027-11-01T09:00:00Z"), end: Date.parse("2027-11-01T09:20:00Z") }]);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://www.googleapis.com/calendar/v3/freeBusy");
    expect(init.headers.Authorization).toBe("Bearer at");
    expect(JSON.parse(init.body).items).toEqual([{ id: "primary" }]);
  });

  it("creates the event with a Meet request and emails the attendee", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ id: "evt1", hangoutLink: "https://meet.google.com/abc-defg-hij" }));
    const result = await createEvent(
      "at",
      {
        bookingId: "b-1",
        summary: "Call",
        description: "About invoices",
        start: "2027-11-01T09:00:00.000Z",
        end: "2027-11-01T09:30:00.000Z",
        attendee: { email: "dawit@example.test", displayName: "Dawit" },
      },
      fetchImpl,
    );
    expect(result).toEqual({ id: "evt1", meetUrl: "https://meet.google.com/abc-defg-hij" });
    const [url, init] = fetchImpl.mock.calls[0];
    const u = new URL(url);
    expect(u.pathname).toBe("/calendar/v3/calendars/primary/events");
    // Without conferenceDataVersion=1 Google silently drops the Meet request.
    expect(u.searchParams.get("conferenceDataVersion")).toBe("1");
    expect(u.searchParams.get("sendUpdates")).toBe("all");
    const body = JSON.parse(init.body);
    expect(body.conferenceData.createRequest).toEqual({ requestId: "b-1", conferenceSolutionKey: { type: "hangoutsMeet" } });
    expect(body.attendees).toEqual([{ email: "dawit@example.test", displayName: "Dawit" }]);
    expect(body.start).toEqual({ dateTime: "2027-11-01T09:00:00.000Z" });
  });
});
