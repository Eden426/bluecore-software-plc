import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import { useAuth } from "../../auth/useAuth.js";
import {
  addInternalNote,
  describeError,
  getTicket,
  listAssignableStaff,
  listClients,
  listProducts,
  sendReply,
  updateTicket,
} from "../../lib/api.js";
import { canManageContacts } from "../../lib/permissions.js";
import {
  PRIORITY_TONE,
  STATUS_LABEL,
  STATUS_TONE,
  formatDateTime,
  slaState,
  ticketRef,
} from "../../lib/tickets.js";
import { useAsync } from "../../lib/useAsync.js";
import { Badge, Button, Card, ErrorBanner, Field, Input, Select, Textarea } from "../../components/ui.jsx";

export default function TicketDetailPage() {
  const { ticketId } = useParams();
  const { staff } = useAuth();
  const { data: ticket, error, loading, reload } = useAsync(() => getTicket(ticketId), ticketId);
  const { data: people } = useAsync(listAssignableStaff);

  if (loading) return <p className="text-sm text-[var(--bluecore-text-muted)]">Loading…</p>;
  if (error) return <ErrorBanner message={error} />;

  const canWork = canManageContacts(staff);
  const sla = slaState(ticket);
  const names = Object.fromEntries((people ?? []).map((p) => [p.id, p.full_name || p.email]));

  return (
    <>
      <Link
        to="/admin/tickets"
        className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--bluecore-text-secondary)] hover:underline"
      >
        <ArrowLeft size={14} aria-hidden="true" /> All tickets
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[var(--bluecore-text-muted)]">
            {ticketRef(ticket.number)} · via {ticket.channel} · opened {formatDateTime(ticket.created_at)}
          </p>
          <h1 className="text-2xl font-semibold text-[var(--bluecore-heading)]">{ticket.subject}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={STATUS_TONE[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
          <Badge tone={PRIORITY_TONE[ticket.priority]}>{ticket.priority}</Badge>
          <Badge tone={sla.tone}>{sla.label}</Badge>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          <Timeline ticket={ticket} names={names} />
          {canWork && ticket.status !== "closed" && <Composer ticket={ticket} staff={staff} onSent={reload} />}
        </div>
        <TriagePanel ticket={ticket} people={people ?? []} editable={canWork} onSaved={reload} />
      </div>
    </>
  );
}

const EVENT_TEXT = {
  created: () => "Ticket created",
  status: (e) => `Status changed to ${STATUS_LABEL[e.to_value] ?? e.to_value}`,
  priority: (e) => `Priority changed to ${e.to_value}`,
  assignee: (e, names) => (e.to_value ? `Assigned to ${names[e.to_value] ?? "a teammate"}` : "Unassigned"),
  client: (e) => (e.to_value ? "Client changed" : "Client cleared"),
  product: (e) => (e.to_value ? "Product changed" : "Product cleared"),
};

function Timeline({ ticket, names }) {
  const items = [
    ...ticket.ticket_messages.map((m) => ({ type: "message", at: m.created_at, item: m })),
    ...ticket.ticket_events.map((e) => ({ type: "event", at: e.created_at, item: e })),
  ].sort((a, b) => new Date(a.at) - new Date(b.at));

  return (
    <ol className="space-y-3" aria-label="Conversation">
      {items.map(({ type, item }) =>
        type === "event" ? (
          <li key={`e${item.id}`} className="px-2 text-xs text-[var(--bluecore-text-muted)]">
            {(EVENT_TEXT[item.event] ?? (() => item.event))(item, names)}
            {item.actor_id && names[item.actor_id] ? ` by ${names[item.actor_id]}` : ""} · {formatDateTime(item.created_at)}
          </li>
        ) : (
          <li key={item.id}>
            <Message message={item} />
          </li>
        ),
      )}
    </ol>
  );
}

const MESSAGE_STYLE = {
  customer: "border-[var(--bluecore-border)] bg-white",
  agent: "border-blue-100 bg-blue-50/60",
  note: "border-amber-200 bg-amber-50",
  system: "border-[var(--bluecore-border)] bg-slate-50",
};

function Message({ message }) {
  const label = { customer: "Customer", agent: "Reply", note: "Internal note", system: "System" }[message.kind];
  return (
    <article className={`rounded-lg border p-4 ${MESSAGE_STYLE[message.kind]}`}>
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-medium text-[var(--bluecore-text)]">
          {message.author_name || message.author_email || "Unknown"}{" "}
          <span className="font-normal text-[var(--bluecore-text-muted)]">· {label}</span>
          {message.kind === "note" && <Lock size={12} className="ml-1 inline" aria-label="Only visible to staff" />}
        </span>
        <time className="text-[var(--bluecore-text-muted)]" dateTime={message.created_at}>
          {formatDateTime(message.created_at)}
        </time>
      </header>
      {/* Plain text only: inbound HTML is stored but never rendered unsanitised. */}
      <p className="whitespace-pre-wrap break-words text-sm text-[var(--bluecore-text)]">{message.body_text || "(no text)"}</p>
    </article>
  );
}

function Composer({ ticket, staff, onSent }) {
  const [mode, setMode] = useState("reply");
  const [body, setBody] = useState("");
  const [nextStatus, setNextStatus] = useState("pending");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "reply") {
        await sendReply(ticket.id, body);
        if (nextStatus && nextStatus !== ticket.status) await updateTicket(ticket.id, { status: nextStatus });
      } else {
        await addInternalNote(ticket.id, staff, body);
      }
      setBody("");
      await onSent();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-[var(--bluecore-border)] bg-white">
      <div role="tablist" aria-label="Compose" className="flex border-b border-[var(--bluecore-border)] text-sm">
        {[
          { id: "reply", label: "Reply to customer", icon: Mail },
          { id: "note", label: "Internal note", icon: Lock },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 ${
              mode === id ? "border-b-2 border-[var(--bluecore-primary)] font-medium" : "text-[var(--bluecore-text-secondary)]"
            }`}
          >
            <Icon size={14} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>
      <div className="space-y-3 p-4">
        <ErrorBanner message={error} />
        <Textarea
          rows={5}
          required
          aria-label={mode === "reply" ? "Reply" : "Internal note"}
          placeholder={mode === "reply" ? `Reply to ${ticket.requester_email}…` : "Visible to Bluecore staff only…"}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={busy || !body.trim()}>
            {busy ? "Sending…" : mode === "reply" ? "Send reply" : "Add note"}
          </Button>
          {mode === "reply" && (
            <label className="flex items-center gap-2 text-sm text-[var(--bluecore-text-secondary)]">
              and set status to
              <select
                aria-label="Status after reply"
                className="rounded-md border border-[var(--bluecore-border-strong)] px-2 py-1 text-sm"
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
              >
                <option value="">(unchanged)</option>
                <option value="pending">Pending customer</option>
                <option value="open">Open</option>
                <option value="on_hold">On hold</option>
                <option value="solved">Solved</option>
              </select>
            </label>
          )}
        </div>
      </div>
    </form>
  );
}

function TriagePanel({ ticket, people, editable, onSaved }) {
  const { data: clients } = useAsync(listClients);
  const { data: products } = useAsync(listProducts);
  const [tags, setTags] = useState(ticket.tags.join(", "));
  const [error, setError] = useState("");

  async function save(changes) {
    setError("");
    try {
      await updateTicket(ticket.id, changes);
      await onSaved();
    } catch (err) {
      setError(describeError(err));
    }
  }

  return (
    <aside className="space-y-4">
      <Card title="Triage">
        <div className="space-y-3">
          <ErrorBanner message={error} />
          <Field label="Status">
            <Select disabled={!editable} value={ticket.status} onChange={(e) => save({ status: e.target.value })}>
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select disabled={!editable} value={ticket.priority} onChange={(e) => save({ priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </Field>
          <Field label="Assignee">
            <Select disabled={!editable} value={ticket.assignee_id ?? ""} onChange={(e) => save({ assignee_id: e.target.value || null })}>
              <option value="">Unassigned</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
              ))}
            </Select>
          </Field>
          <Field label="Client">
            <Select disabled={!editable} value={ticket.client_id ?? ""} onChange={(e) => save({ client_id: e.target.value || null })}>
              <option value="">Unmatched</option>
              {(clients ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Product">
            <Select disabled={!editable} value={ticket.product_id ?? ""} onChange={(e) => save({ product_id: e.target.value || null })}>
              <option value="">Not set</option>
              {(products ?? [])
                .filter((p) => p.kind === "shared" || p.owner_client_id === ticket.client_id || p.id === ticket.product_id)
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </Select>
          </Field>
          <Field label="Tags" hint="Comma-separated; saved when you leave the field.">
            <Input
              disabled={!editable}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              onBlur={() => {
                const next = [...new Set(tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))];
                if (next.join(",") !== ticket.tags.join(",")) save({ tags: next });
              }}
            />
          </Field>
        </div>
      </Card>
      <Card title="Requester">
        <dl className="space-y-1 text-sm">
          <div>{ticket.requester_name || "—"}</div>
          <div className="break-all text-[var(--bluecore-text-secondary)]">{ticket.requester_email}</div>
          {ticket.client && (
            <Link to={`/admin/clients/${ticket.client.id}`} className="text-[var(--bluecore-primary)] hover:underline">
              {ticket.client.name}
            </Link>
          )}
        </dl>
      </Card>
      <Card title="SLA">
        <dl className="space-y-1 text-xs text-[var(--bluecore-text-secondary)]">
          <div>First reply due: {formatDateTime(ticket.first_response_due_at)}</div>
          <div>
            First replied: {ticket.first_responded_at ? formatDateTime(ticket.first_responded_at) : "not yet"}
          </div>
          <div>Resolution due: {formatDateTime(ticket.resolution_due_at)}</div>
        </dl>
      </Card>
    </aside>
  );
}
