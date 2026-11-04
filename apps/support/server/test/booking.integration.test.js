// @vitest-environment node
// Runs the booking endpoints against the local Supabase stack with a mocked
// Google (skipped unless SUPABASE_URL / SUPABASE_SECRET_KEY are set).
import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { handleBook } from "../../api/booking/book.js";
import { handleCancel } from "../../api/booking/cancel.js";
import { handleSlots } from "../../api/booking/slots.js";
import { triageBookingTicket } from "../triage.js";
import { encryptToken } from "../google.js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const run = url && key ? describe : describe.skip;
const config = { clientId: "c", clientSecret: "s", redirectUri: "http://x/cb", tokenKey: "test-key-".repeat(5) };

// Google stand-in: the agent is busy 09:00-09:30 UTC on the test day.
function google({ failEvents = false } = {}) {
  return vi.fn(async (u, init = {}) => {
    if (u.startsWith("https://oauth2")) return Response.json({ access_token: "at" });
    if (u.endsWith("/freeBusy")) {
      return Response.json({ calendars: { primary: { busy: [{ start: "2027-11-01T09:00:00Z", end: "2027-11-01T09:30:00Z" }] } } });
    }
    if (init.method === "DELETE") return new Response(null, { status: 204 });
    if (failEvents) return new Response("boom", { status: 500 });
    return Response.json({ id: "evt_int", hangoutLink: "https://meet.google.com/int-test" });
  });
}

run("booking API (local Supabase)", { timeout: 30_000 }, () => {
  const db = url && createClient(url, key, { auth: { persistSession: false } });
  let staffId;
  const created = [];

  beforeAll(async () => {
    const { data } = await db.auth.admin.createUser({ email: `booker-${Date.now()}@bk.test`, password: "pw-123456789", email_confirm: true });
    staffId = data.user.id;
    await db.from("staff").update({ role: "agent", full_name: "Liya Tadesse" }).eq("id", staffId);
    await db.from("calendar_connections").insert({ staff_id: staffId, google_email: "liya@gmail.test", refresh_token_enc: encryptToken("r", config.tokenKey) });
    await db.from("booking_agents").insert({ staff_id: staffId, timezone: "UTC", accepts_bookings: true });
    await db.from("availability_windows").insert({ staff_id: staffId, weekday: 1, start_time: "09:00", end_time: "10:30" });
  });

  afterAll(async () => {
    const { data } = await db.from("bookings").select("ticket_id").eq("staff_id", staffId);
    await db.from("bookings").delete().eq("staff_id", staffId);
    for (const id of (data ?? []).map((b) => b.ticket_id).filter(Boolean)) await db.from("tickets").delete().eq("id", id);
    if (staffId) await db.auth.admin.deleteUser(staffId);
  });

  const now = Date.parse("2027-10-31T12:00:00Z");
  const slotsReq = () => new Request("http://x/api/booking/slots?from=2027-11-01T00:00:00Z&to=2027-11-02T00:00:00Z");
  const book = (start, extra = {}) =>
    new Request("http://x/api/booking/book", {
      method: "POST",
      body: JSON.stringify({ start, name: "Dawit", email: "dawit@addislogistics.example", topic: "Invoices fail to sync", ...extra }),
    });

  it("offers weekly hours minus Google busy times", async () => {
    const res = await handleSlots(slotsReq(), { db, config, fetchImpl: google(), now });
    const { slots } = await res.json();
    const mine = slots.map((s) => s.start).filter((s) => s.startsWith("2027-11-01T09") || s.startsWith("2027-11-01T10"));
    expect(mine).toEqual(["2027-11-01T09:30:00.000Z", "2027-11-01T10:00:00.000Z"]);
  });

  it("refuses a time that is busy in Google", async () => {
    const res = await handleBook(book("2027-11-01T09:00:00.000Z"), { db, config, fetchImpl: google() });
    expect(res.status).toBe(409);
  });

  it("removes the reservation if Google fails", async () => {
    const res = await handleBook(book("2027-11-01T09:30:00.000Z"), { db, config, fetchImpl: google({ failEvents: true }) });
    expect(res.status).toBe(502);
    const { count } = await db.from("bookings").select("id", { count: "exact", head: true }).eq("staff_id", staffId);
    expect(count).toBe(0);
  });

  it("books, opens a ticket, and cancels by token", async () => {
    const fetchImpl = google();
    const res = await handleBook(book("2027-11-01T09:30:00.000Z"), { db, config, fetchImpl });
    expect(res.status).toBe(201);
    const { booking, cancelToken } = await res.json();
    created.push(cancelToken);
    expect(booking).toMatchObject({ agentName: "Liya", meetUrl: "https://meet.google.com/int-test" });
    expect(booking.ticketNumber).toBeGreaterThan(0);

    const again = await handleBook(book("2027-11-01T09:30:00.000Z"), { db, config, fetchImpl });
    expect(again.status).toBe(409);

    const look = await handleCancel(new Request("http://x/api/booking/cancel", { headers: { "x-booking-token": cancelToken } }), { db, config });
    expect((await look.json()).booking).toMatchObject({ status: "confirmed", agent_name: "Liya" });

    const cancel = await handleCancel(
      new Request("http://x/api/booking/cancel", { method: "POST", body: JSON.stringify({ token: cancelToken }) }),
      { db, config, fetchImpl },
    );
    expect(await cancel.json()).toEqual({ cancelled: true, calendarUpdated: true });
    expect(fetchImpl.mock.calls.some(([u, i]) => i?.method === "DELETE" && u.includes("/events/evt_int"))).toBe(true);
  });

  it("triages a new booking's ticket after responding, and only once", async () => {
    const work = [];
    const triage = { fake: true, model: "fake" };
    const res = await handleBook(book("2027-11-01T10:00:00.000Z"), { db, config, fetchImpl: google(), triage, later: (p) => work.push(p) });
    expect(res.status).toBe(201);
    expect(work).toHaveLength(1);
    await work[0];
    const { data: booking } = await db.from("bookings").select("id, ticket_id").eq("staff_id", staffId).eq("starts_at", "2027-11-01T10:00:00.000Z").single();
    const { data: first } = await db.from("ticket_ai_triage").select("created_at, status").eq("ticket_id", booking.ticket_id).single();
    expect(first.status).toBe("suggested");

    await triageBookingTicket(db, triage, booking.id);
    const { data: second } = await db.from("ticket_ai_triage").select("created_at").eq("ticket_id", booking.ticket_id).single();
    expect(second.created_at).toBe(first.created_at);
  });
});
