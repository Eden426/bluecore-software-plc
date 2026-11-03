// Pure helpers shared by the email functions in apps/support/api. Kept free of
// I/O so they can be unit tested.

export const ticketRef = (number) => `BC-${number}`;

// Case-insensitive header lookup; Resend's received-email `headers` is a plain
// object whose key casing isn't documented.
export function headerValue(headers, name) {
  if (!headers || typeof headers !== "object") return undefined;
  const wanted = name.toLowerCase();
  const key = Object.keys(headers).find((k) => k.toLowerCase() === wanted);
  const value = key === undefined ? undefined : headers[key];
  return Array.isArray(value) ? value.join(" ") : value;
}

// "<a@x> <b@y>" -> ["<a@x>", "<b@y>"]
export function parseMessageIds(value) {
  if (typeof value !== "string") return [];
  return value.match(/<[^<>\s]+>/g) ?? [];
}

// "Sara Tesfaye <Sara@Example.com>" -> { email: "sara@example.com", name: "Sara Tesfaye" }
export function parseAddress(value) {
  if (typeof value !== "string") return { email: "", name: "" };
  const match = value.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (match) return { email: match[2].trim().toLowerCase(), name: match[1].trim() };
  return { email: value.trim().toLowerCase(), name: "" };
}

// Shape a Resend received email into the payload ingest_inbound_email() expects.
export function toIngestPayload(received) {
  const from = parseAddress(received.from);
  const references = parseMessageIds(headerValue(received.headers, "references"));
  const inReplyTo = parseMessageIds(headerValue(received.headers, "in-reply-to"))[0];
  return {
    resend_email_id: received.id,
    from_email: from.email,
    from_name: from.name,
    to: [...(received.to ?? []), ...(received.received_for ?? [])],
    subject: received.subject ?? "",
    text: received.text ?? "",
    html: received.html ?? null,
    message_id: received.message_id ?? null,
    ...(inReplyTo ? { in_reply_to: inReplyTo } : {}),
    ...(references.length ? { references } : {}),
  };
}

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Build the Resend send payload for an agent reply. `config` holds the
// verified sending address and the inbound domain for reply addresses.
export function buildReplyEmail({ ticket, message, agentName, threadIds, config, messageId }) {
  const [localPart, domain] = config.supportAddress.split("@");
  const subject = `Re: [${ticketRef(ticket.number)}] ${ticket.subject}`;
  const headers = { "Message-ID": messageId };
  if (threadIds.length) {
    headers["In-Reply-To"] = threadIds[threadIds.length - 1];
    headers.References = threadIds.join(" ");
  }
  const footer = `Ticket ${ticketRef(ticket.number)} · Reply to this email to add to the conversation.`;
  return {
    from: `${agentName} via Bluecore Support <${config.fromAddress}>`,
    to: [ticket.requester_email],
    reply_to: `${localPart}+${ticket.reply_token}@${domain}`,
    subject,
    headers,
    text: `${message.body_text}\n\n--\n${footer}`,
    html: `<div>${escapeHtml(message.body_text).replace(/\r?\n/g, "<br>")}</div><hr><p style="color:#64748b;font-size:12px">${escapeHtml(footer)}</p>`,
  };
}
