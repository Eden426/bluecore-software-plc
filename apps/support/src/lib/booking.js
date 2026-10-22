// Visitor side of booking: plain calls to the server endpoints.
async function call(path, { method = "GET", body, headers = {} } = {}) {
  const response = await fetch(path, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || "Booking is unavailable right now.");
    error.status = response.status;
    error.fields = result.errors;
    throw error;
  }
  return result;
}

export function fetchSlots({ from, to, link }) {
  const params = new URLSearchParams({ from, to, ...(link ? { link } : {}) });
  return call(`/api/booking/slots?${params}`);
}

export const bookSlot = (values) => call("/api/booking/book", { method: "POST", body: values });
export const lookupBooking = (token) => call("/api/booking/cancel", { headers: { "X-Booking-Token": token } });
export const cancelOwnBooking = (token) => call("/api/booking/cancel", { method: "POST", body: { token } });

// Tokens travel in the URL fragment, which browsers never send to servers or
// in Referer headers.
export function readFragment(name) {
  return new URLSearchParams(window.location.hash.slice(1)).get(name);
}

const pad = (n) => String(n).padStart(2, "0");
// Local calendar day key, e.g. "2027-11-01".
export const dayKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function groupByDay(slots) {
  const days = new Map();
  for (const slot of slots) {
    const key = dayKey(new Date(slot.start));
    if (!days.has(key)) days.set(key, []);
    days.get(key).push(slot);
  }
  return days;
}

export const formatDay = (key) =>
  new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
export const formatTime = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
export const formatWhen = (iso) =>
  new Date(iso).toLocaleString(undefined, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
export const visitorTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
