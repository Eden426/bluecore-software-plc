import { useState } from "react";
import { Link } from "react-router";
import { Video } from "lucide-react";
import { useAuth } from "../../auth/useAuth.js";
import { cancelBooking, listBookings } from "../../lib/api.js";
import { canManageContacts } from "../../lib/permissions.js";
import { formatDateTime, ticketRef } from "../../lib/tickets.js";
import { useAsync } from "../../lib/useAsync.js";
import { Badge, Button, ErrorBanner, PageHeader } from "../../components/ui.jsx";

export default function BookingsPage() {
  const { staff } = useAuth();
  const [view, setView] = useState("upcoming");
  const { data: bookings, error, loading, reload } = useAsync(() => listBookings(view), view);
  const [actionError, setActionError] = useState("");
  const canWork = canManageContacts(staff);

  async function cancel(booking) {
    if (!window.confirm(`Cancel the call with ${booking.requester_name}? They'll get a cancellation email from Google.`)) return;
    setActionError("");
    try {
      const result = await cancelBooking(booking.id);
      if (!result.calendarUpdated) setActionError("Cancelled, but the Google Calendar event couldn't be removed. Delete it by hand.");
      await reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <>
      <PageHeader
        title="Calls"
        description="One-to-one calls customers booked from the help center."
        actions={
          canWork && (
            <Link to="/admin/availability" className="text-sm text-[var(--bluecore-primary)] hover:underline">
              My availability
            </Link>
          )
        }
      />
      <div role="tablist" aria-label="Call views" className="mb-4 flex gap-1 text-sm">
        {[
          ["upcoming", "Upcoming"],
          ["past", "Past & cancelled"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`rounded-md px-3 py-1.5 ${view === id ? "bg-white font-medium shadow-sm" : "text-[var(--bluecore-text-secondary)]"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <ErrorBanner message={error || actionError} />
      {loading ? (
        <p className="text-sm text-[var(--bluecore-text-muted)]">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--bluecore-border)] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--bluecore-border)] text-xs text-[var(--bluecore-text-muted)]">
              <tr>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">With</th>
                <th className="px-4 py-2 font-medium">Ticket</th>
                <th className="px-4 py-2 font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bluecore-border)]">
              {(bookings ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-[var(--bluecore-text-muted)]">No calls.</td>
                </tr>
              )}
              {(bookings ?? []).map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDateTime(b.starts_at)}
                    {b.status === "cancelled" && <span className="ml-2"><Badge tone="neutral">cancelled</Badge></span>}
                  </td>
                  <td className="px-4 py-3">
                    <div>{b.requester_name}</div>
                    <div className="text-xs text-[var(--bluecore-text-muted)]">{b.requester_email}</div>
                  </td>
                  <td className="px-4 py-3">{b.staff?.full_name || b.staff?.email}</td>
                  <td className="px-4 py-3">
                    {b.ticket && (
                      <Link to={`/admin/tickets/${b.ticket.id}`} className="text-[var(--bluecore-primary)] hover:underline">
                        {ticketRef(b.ticket.number)}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {b.meet_url && b.status === "confirmed" && (
                        <a href={b.meet_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--bluecore-primary)] hover:underline">
                          <Video size={14} aria-hidden="true" /> Meet
                        </a>
                      )}
                      {canWork && view === "upcoming" && (
                        <Button variant="danger" onClick={() => cancel(b)}>Cancel</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
