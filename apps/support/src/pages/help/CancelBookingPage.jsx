import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { cancelOwnBooking, formatWhen, lookupBooking, readFragment } from "../../lib/booking.js";
import { SUPPORT_EMAIL } from "../../lib/config.js";
import { usePageTitle } from "../../lib/usePageTitle.js";
import { Button, ErrorBanner } from "../../components/ui.jsx";

// /book/cancel#token=<cancel token>
export default function CancelBookingPage() {
  usePageTitle("Cancel a call");
  const token = useMemo(() => readFragment("token"), []);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(token ? "" : "This cancellation link is incomplete.");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    lookupBooking(token).then(({ booking }) => setBooking(booking), (err) => setError(err.message));
  }, [token]);

  async function cancel() {
    setBusy(true);
    try {
      await cancelOwnBooking(token);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const over = booking && new Date(booking.ends_at) < new Date();
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-[var(--bluecore-heading)]">Cancel your call</h1>
      <div className="mt-4 text-left">
        <ErrorBanner message={error} />
      </div>
      {error && !booking && (
        <p className="mt-4 text-sm text-[var(--bluecore-text-secondary)]">
          Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[var(--bluecore-primary)] hover:underline">{SUPPORT_EMAIL}</a>{" "}
          and we'll cancel it for you.
        </p>
      )}
      {booking && (
        <>
          <p className="mt-2 text-[var(--bluecore-text-secondary)]">
            {formatWhen(booking.starts_at)} with {booking.agent_name}
          </p>
          {done || booking.status === "cancelled" ? (
            <p className="mt-6 text-emerald-700" role="status">
              This call is cancelled. <Link to="/book" className="text-[var(--bluecore-primary)] hover:underline">Book another time</Link>
            </p>
          ) : over ? (
            <p className="mt-6 text-sm text-[var(--bluecore-text-muted)]">This call has already taken place.</p>
          ) : (
            <Button variant="danger" className="mt-6" disabled={busy} onClick={cancel}>
              {busy ? "Cancelling…" : "Cancel call"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
