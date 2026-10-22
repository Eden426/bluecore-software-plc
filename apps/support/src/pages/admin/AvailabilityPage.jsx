import { useState } from "react";
import { useSearchParams } from "react-router";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../auth/useAuth.js";
import {
  connectGoogleCalendar,
  describeError,
  disconnectGoogleCalendar,
  getBookingSetup,
  saveBookingSetup,
} from "../../lib/api.js";
import { canManageContacts } from "../../lib/permissions.js";
import { formatDateTime } from "../../lib/tickets.js";
import { useAsync } from "../../lib/useAsync.js";
import { Badge, Button, Card, ErrorBanner, Field, PageHeader, Select } from "../../components/ui.jsx";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const GOOGLE_OUTCOME = {
  connected: ["Google Calendar connected.", false],
  denied: ["Google access was not granted.", true],
  expired: ["That sign-in took too long. Please try again.", true],
  failed: ["Google Calendar couldn't be connected. Make sure calendar access is ticked, then try again.", true],
  unavailable: ["Google Calendar isn't configured on this server.", true],
};
const ZONES = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"];

// /admin/availability: an agent's own Google connection and bookable hours.
export default function AvailabilityPage() {
  const { staff } = useAuth();
  const { data, error, loading, reload } = useAsync(() => getBookingSetup(staff.id), staff.id);
  const [params] = useSearchParams();
  const outcome = GOOGLE_OUTCOME[params.get("google")];

  if (!canManageContacts(staff)) return <ErrorBanner message="Only agents can take bookings." />;
  if (loading) return <p className="text-sm text-[var(--bluecore-text-muted)]">Loading…</p>;
  if (error) return <ErrorBanner message={describeError(error)} />;

  return (
    <>
      <PageHeader title="My availability" description="When customers can book a 30-minute call with you from the help center." />
      {outcome && (
        <p role="status" className={`mb-4 text-sm ${outcome[1] ? "text-red-700" : "text-emerald-700"}`}>{outcome[0]}</p>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <HoursEditor key={data.agent?.updated_at ?? "new"} staffId={staff.id} setup={data} onSaved={reload} />
        <GoogleCard connection={data.connection} onChanged={reload} />
      </div>
    </>
  );
}

function GoogleCard({ connection, onChanged }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(fn) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Card title="Google Calendar">
      <div className="space-y-3 text-sm">
        <ErrorBanner message={error} />
        {connection ? (
          <>
            <div className="flex items-center gap-2">
              <span className="break-all">{connection.google_email || "Connected account"}</span>
              <Badge tone={connection.status === "connected" ? "green" : "red"}>
                {connection.status === "connected" ? "connected" : "needs reconnecting"}
              </Badge>
            </div>
            <p className="text-xs text-[var(--bluecore-text-muted)]">Since {formatDateTime(connection.connected_at)}</p>
            <p className="text-xs text-[var(--bluecore-text-secondary)]">
              Busy times on this calendar are hidden from customers, and booked calls are added to it with a Meet link.
            </p>
          </>
        ) : (
          <p className="text-[var(--bluecore-text-secondary)]">
            Connect your Google Calendar so customers only see times you're free, and calls land on your calendar with a Meet link.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {(!connection || connection.status !== "connected") && (
            <Button disabled={busy} onClick={() => run(async () => (window.location.href = await connectGoogleCalendar()))}>
              {connection ? "Reconnect" : "Connect Google Calendar"}
            </Button>
          )}
          {connection && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await disconnectGoogleCalendar();
                  await onChanged();
                })
              }
            >
              Disconnect
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function HoursEditor({ staffId, setup, onSaved }) {
  const [timezone, setTimezone] = useState(setup.agent?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [accepts, setAccepts] = useState(setup.agent?.accepts_bookings ?? false);
  const [windows, setWindows] = useState(
    setup.windows.map(({ weekday, start_time, end_time }) => ({ weekday, start_time: start_time.slice(0, 5), end_time: end_time.slice(0, 5) })),
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (index, changes) => setWindows(windows.map((w, i) => (i === index ? { ...w, ...changes } : w)));

  async function save(event) {
    event.preventDefault();
    setError("");
    setSaved("");
    if (windows.some((w) => w.end_time <= w.start_time)) return setError("Each block must end after it starts.");
    setBusy(true);
    try {
      await saveBookingSetup(staffId, { timezone, accepts_bookings: accepts, windows });
      setSaved("Saved.");
      await onSaved();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-lg border border-[var(--bluecore-border)] bg-white p-5">
      <ErrorBanner message={error} />
      {saved && <p role="status" className="text-sm text-emerald-700">{saved}</p>}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={accepts} onChange={(e) => setAccepts(e.target.checked)} />
        Accept bookings
      </label>
      {accepts && !setup.connection && (
        <p className="text-xs text-amber-800">Connect Google Calendar too, or customers won't see your times.</p>
      )}
      <Field label="Time zone" hint="Your hours below are in this time zone, including daylight-saving changes.">
        <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
          {ZONES.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </Select>
      </Field>
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium">Weekly hours</legend>
        {windows.length === 0 && <p className="text-sm text-[var(--bluecore-text-muted)]">No hours yet.</p>}
        {windows.map((w, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Day"
              value={w.weekday}
              onChange={(e) => update(i, { weekday: Number(e.target.value) })}
              className="rounded-md border border-[var(--bluecore-border-strong)] px-2 py-1.5 text-sm"
            >
              {WEEKDAYS.map((d, idx) => (
                <option key={d} value={idx + 1}>{d}</option>
              ))}
            </select>
            <input aria-label="From" type="time" step={1800} value={w.start_time} onChange={(e) => update(i, { start_time: e.target.value })}
              className="rounded-md border border-[var(--bluecore-border-strong)] px-2 py-1 text-sm" />
            <span className="text-sm">to</span>
            <input aria-label="To" type="time" step={1800} value={w.end_time} onChange={(e) => update(i, { end_time: e.target.value })}
              className="rounded-md border border-[var(--bluecore-border-strong)] px-2 py-1 text-sm" />
            <button type="button" aria-label="Remove block" onClick={() => setWindows(windows.filter((_, j) => j !== i))}
              className="rounded p-1 text-[var(--bluecore-text-muted)] hover:text-red-700">
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="secondary" onClick={() => setWindows([...windows, { weekday: 1, start_time: "09:00", end_time: "12:00" }])}>
            <Plus size={14} aria-hidden="true" /> Add hours
          </Button>
          {windows.length === 0 && (
            <Button
              variant="secondary"
              onClick={() =>
                setWindows([1, 2, 3, 4, 5].map((weekday) => ({ weekday, start_time: "09:00", end_time: "17:00" })))
              }
            >
              Weekdays 9–5
            </Button>
          )}
        </div>
      </fieldset>
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save availability"}</Button>
    </form>
  );
}
