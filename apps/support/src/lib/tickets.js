export const STATUS_LABEL = {
  new: "New",
  open: "Open",
  pending: "Pending customer",
  on_hold: "On hold",
  solved: "Solved",
  closed: "Closed",
};
export const STATUS_TONE = { new: "blue", open: "blue", pending: "brown", on_hold: "neutral", solved: "green", closed: "neutral" };
export const PRIORITY_TONE = { low: "neutral", normal: "neutral", high: "brown", urgent: "red" };

export const ticketRef = (number) => `BC-${number}`;

// Where a ticket stands against its SLA right now. First response counts until
// an agent replies; after that, the resolution target applies until solved.
export function slaState(ticket, now = new Date()) {
  if (ticket.status === "solved" || ticket.status === "closed") return { label: "Done", tone: "green" };
  const awaitingFirst = !ticket.first_responded_at;
  const due = new Date(awaitingFirst ? ticket.first_response_due_at : ticket.resolution_due_at);
  if (Number.isNaN(due.getTime())) return { label: "—", tone: "neutral" };
  const minutes = Math.round((due - now) / 60000);
  const what = awaitingFirst ? "reply" : "resolve";
  if (minutes < 0) return { label: `${what} overdue ${formatDuration(-minutes)}`, tone: "red", breached: true };
  return { label: `${what} in ${formatDuration(minutes)}`, tone: minutes <= 60 ? "brown" : "neutral" };
}

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
}

export function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
