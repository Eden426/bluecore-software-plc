import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { CalendarCheck, ChevronLeft, ChevronRight, Video } from "lucide-react";
import {
  bookSlot,
  dayKey,
  fetchSlots,
  formatDay,
  formatTime,
  formatWhen,
  groupByDay,
  readFragment,
  visitorTimezone,
} from "../../lib/booking.js";
import { usePageTitle } from "../../lib/usePageTitle.js";
import { Button, ErrorBanner, Field, Input, Textarea } from "../../components/ui.jsx";

const DAY = 86_400_000;
const WEEKS = 2; // matches the server's 14-day horizon

// /book: pick a 30-minute slot, leave details, get a Google Meet invite.
// /book#link=<token> comes from an agent and ties the call to a ticket.
export default function BookPage() {
  usePageTitle("Book a call");
  const link = useMemo(() => readFragment("link"), []);
  const [week, setWeek] = useState(0);
  const [state, setState] = useState({ loading: true, slots: [], ticket: null, error: "", key: null });
  const [chosen, setChosen] = useState(null);
  const [booked, setBooked] = useState(null);

  const range = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const from = new Date(start.getTime() + week * 7 * DAY);
    return { from: from.toISOString(), to: new Date(from.getTime() + 7 * DAY).toISOString(), key: `${week}` };
  }, [week]);

  useEffect(() => {
    let cancelled = false;
    fetchSlots({ ...range, link }).then(
      ({ slots, link: ticket }) => !cancelled && setState({ loading: false, slots, ticket, error: "", key: range.key }),
      (err) => !cancelled && setState({ loading: false, slots: [], ticket: null, error: err.message, key: range.key }),
    );
    return () => {
      cancelled = true;
    };
  }, [range, link]);

  if (booked) return <Confirmation booked={booked} />;
  const loading = state.key !== range.key;
  const days = groupByDay(state.slots);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-[var(--bluecore-heading)]">Book a call with support</h1>
      <p className="mt-2 text-[var(--bluecore-text-secondary)]">
        30 minutes on Google Meet with a Bluecore engineer. Times are shown in your time zone ({visitorTimezone()}).
      </p>
      {state.ticket && (
        <p className="mt-4 rounded-md border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm">
          This call is about ticket <strong>BC-{state.ticket.ticket_number}</strong>: {state.ticket.subject}
        </p>
      )}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section aria-label="Available times">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[var(--bluecore-heading)]">{week === 0 ? "This week" : "Next week"}</h2>
            <div className="flex gap-1">
              <Button variant="secondary" aria-label="Previous week" disabled={week === 0} onClick={() => setWeek(week - 1)}>
                <ChevronLeft size={16} aria-hidden="true" />
              </Button>
              <Button variant="secondary" aria-label="Next week" disabled={week >= WEEKS - 1} onClick={() => setWeek(week + 1)}>
                <ChevronRight size={16} aria-hidden="true" />
              </Button>
            </div>
          </div>
          <ErrorBanner message={state.error} />
          {loading ? (
            <p className="text-sm text-[var(--bluecore-text-muted)]">Finding free times…</p>
          ) : days.size === 0 && !state.error ? (
            <p className="rounded-lg border border-dashed border-[var(--bluecore-border-strong)] p-6 text-sm text-[var(--bluecore-text-secondary)]">
              No free times {week === 0 ? "this week" : "next week"}.{" "}
              {week < WEEKS - 1 ? "Try next week, or " : ""}
              <Link to="/" className="text-[var(--bluecore-primary)] hover:underline">chat with us</Link> instead.
            </p>
          ) : (
            <div className="space-y-5">
              {[...days].map(([key, slots]) => (
                <div key={key}>
                  <h3 className="mb-2 text-sm font-medium text-[var(--bluecore-text-secondary)]">
                    {key === dayKey(new Date()) ? "Today" : formatDay(key)}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.start}
                        type="button"
                        aria-pressed={chosen?.start === slot.start}
                        onClick={() => setChosen(slot)}
                        className={`rounded-md border px-3 py-1.5 text-sm ${
                          chosen?.start === slot.start
                            ? "border-[var(--bluecore-primary)] bg-[var(--bluecore-primary)] text-white"
                            : "border-[var(--bluecore-border-strong)] hover:border-[var(--bluecore-primary)]"
                        }`}
                      >
                        {formatTime(slot.start)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <DetailsForm
          key={state.ticket ? "ticket" : "plain"}
          slot={chosen}
          ticket={state.ticket}
          link={link}
          onBooked={setBooked}
          onTaken={() => {
            setChosen(null);
            setState((s) => ({ ...s, slots: s.slots.filter((x) => x.start !== chosen.start) }));
          }}
        />
      </div>
    </div>
  );
}

function DetailsForm({ slot, ticket, link, onBooked, onTaken }) {
  const [form, setForm] = useState({ name: ticket?.name ?? "", email: ticket?.email ?? "", topic: ticket?.subject ?? "" });
  const [error, setError] = useState("");
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setFields({});
    try {
      const result = await bookSlot({ ...form, start: slot.start, ...(link ? { link } : {}) });
      onBooked(result);
    } catch (err) {
      setError(err.message);
      setFields(err.fields ?? {});
      if (err.status === 409) onTaken();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="h-fit space-y-4 rounded-lg border border-[var(--bluecore-border)] bg-slate-50 p-5">
      <h2 className="font-semibold text-[var(--bluecore-heading)]">Your details</h2>
      <p className="text-sm text-[var(--bluecore-text-secondary)]">
        {slot ? <>Call on <strong>{formatWhen(slot.start)}</strong></> : "Choose a time first."}
      </p>
      <ErrorBanner message={error} />
      <Field label="Name" hint={fields.name}>
        <Input required maxLength={120} autoComplete="name" value={form.name} onChange={set("name")} />
      </Field>
      <Field label="Work email" hint={fields.email ?? "We'll send the Google Meet invite here."}>
        <Input required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={set("email")} />
      </Field>
      <Field label="What would you like to discuss?" hint={fields.topic}>
        <Textarea required rows={4} maxLength={2000} value={form.topic} onChange={set("topic")} />
      </Field>
      <Button type="submit" className="w-full" disabled={!slot || busy}>
        {busy ? "Booking…" : "Book call"}
      </Button>
    </form>
  );
}

function Confirmation({ booked }) {
  const { booking, cancelToken } = booked;
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <CalendarCheck size={40} className="mx-auto text-emerald-600" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-semibold text-[var(--bluecore-heading)]">You're booked</h1>
      <p className="mt-2 text-[var(--bluecore-text-secondary)]">
        {formatWhen(booking.start)} with {booking.agentName}. A calendar invite is on its way to your inbox.
      </p>
      <p className="mt-1 text-sm text-[var(--bluecore-text-muted)]">Reference BC-{booking.ticketNumber}</p>
      {booking.meetUrl && (
        <a
          href={booking.meetUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-[var(--bluecore-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--bluecore-primary-hover)]"
        >
          <Video size={16} aria-hidden="true" /> {booking.meetUrl.replace("https://", "")}
        </a>
      )}
      <p className="mt-8 text-sm text-[var(--bluecore-text-secondary)]">
        Can't make it?{" "}
        <a href={`/book/cancel#token=${cancelToken}`} className="text-[var(--bluecore-primary)] hover:underline">
          Cancel this call
        </a>{" "}
        (keep this link; it's also the only way to cancel without emailing us).
      </p>
    </div>
  );
}
