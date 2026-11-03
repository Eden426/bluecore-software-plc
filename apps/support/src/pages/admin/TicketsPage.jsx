import { useState } from "react";
import { Link } from "react-router";
import { Plus } from "lucide-react";
import { useAuth } from "../../auth/useAuth.js";
import { listClients, listTickets } from "../../lib/api.js";
import { canManageContacts } from "../../lib/permissions.js";
import { PRIORITY_TONE, STATUS_LABEL, STATUS_TONE, slaState, ticketRef } from "../../lib/tickets.js";
import { useAsync } from "../../lib/useAsync.js";
import { Badge, ErrorBanner, Input, PageHeader, Select } from "../../components/ui.jsx";

const VIEWS = [
  { id: "mine", label: "My open" },
  { id: "unassigned", label: "Unassigned" },
  { id: "open", label: "All open" },
  { id: "done", label: "Solved & closed" },
];

export default function TicketsPage() {
  const { staff } = useAuth();
  const [view, setView] = useState("open");
  const [priority, setPriority] = useState("");
  const [clientId, setClientId] = useState("");
  const [search, setSearch] = useState("");
  const filters = { view, assigneeId: staff.id, priority, clientId, search };
  const { data: tickets, error, loading } = useAsync(() => listTickets(filters), JSON.stringify(filters));
  const { data: clients } = useAsync(listClients);

  return (
    <>
      <PageHeader
        title="Tickets"
        actions={
          canManageContacts(staff) && (
            <Link
              to="/admin/tickets/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--bluecore-primary)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--bluecore-primary-hover)]"
            >
              <Plus size={16} aria-hidden="true" /> Log ticket
            </Link>
          )
        }
      />
      <div role="tablist" aria-label="Ticket views" className="mb-4 flex flex-wrap gap-1 border-b border-[var(--bluecore-border)]">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={view === v.id}
            onClick={() => setView(v.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              view === v.id
                ? "border-[var(--bluecore-primary)] font-medium text-[var(--bluecore-primary)]"
                : "border-transparent text-[var(--bluecore-text-secondary)] hover:text-[var(--bluecore-text)]"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_10rem_14rem]">
        <Input
          type="search"
          aria-label="Search tickets"
          placeholder="Search subject, requester or BC-number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select aria-label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">Any priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </Select>
        <Select aria-label="Client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Any client</option>
          {(clients ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>
      <ErrorBanner message={error} />
      <div className="overflow-x-auto rounded-lg border border-[var(--bluecore-border)] bg-white">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="border-b border-[var(--bluecore-border)] text-xs uppercase text-[var(--bluecore-text-muted)]">
            <tr>
              <th className="px-4 py-2 font-medium">Ticket</th>
              <th className="px-4 py-2 font-medium">Requester</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Priority</th>
              <th className="px-4 py-2 font-medium">Assignee</th>
              <th className="px-4 py-2 font-medium">SLA</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[var(--bluecore-text-muted)]">Loading…</td>
              </tr>
            )}
            {!loading && (tickets ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[var(--bluecore-text-muted)]">No tickets here.</td>
              </tr>
            )}
            {(tickets ?? []).map((t) => {
              const sla = slaState(t);
              return (
                <tr key={t.id} className="border-b border-[var(--bluecore-border)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link to={`/admin/tickets/${t.id}`} className="font-medium text-[var(--bluecore-primary)] hover:underline">
                      {t.subject}
                    </Link>
                    <div className="text-xs text-[var(--bluecore-text-muted)]">
                      {ticketRef(t.number)} · {t.channel}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div>{t.requester_name || t.requester_email}</div>
                    <div className="text-xs text-[var(--bluecore-text-muted)]">{t.client?.name ?? "Unmatched client"}</div>
                  </td>
                  <td className="px-4 py-2"><Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge></td>
                  <td className="px-4 py-2"><Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge></td>
                  <td className="px-4 py-2 text-[var(--bluecore-text-secondary)]">
                    {t.assignee ? t.assignee.full_name || t.assignee.email : "—"}
                  </td>
                  <td className="px-4 py-2"><Badge tone={sla.tone}>{sla.label}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
