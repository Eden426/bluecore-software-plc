import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Send, Ticket } from "lucide-react";
import { useAuth } from "../../auth/useAuth.js";
import {
  convertChatToTicket,
  describeError,
  getChat,
  listChats,
  sendAgentChatMessage,
  updateChat,
} from "../../lib/api.js";
import { visitorChannelName } from "../../lib/chat.js";
import { canManageContacts } from "../../lib/permissions.js";
import { supabase } from "../../lib/supabase.js";
import { formatDateTime, ticketRef } from "../../lib/tickets.js";
import { useAsync } from "../../lib/useAsync.js";
import { Badge, Button, ErrorBanner, PageHeader } from "../../components/ui.jsx";

const STATUS_TONE = { waiting: "red", active: "blue", closed: "neutral" };

// Re-run `onChange` whenever rows in `table` change (Realtime postgres
// changes; RLS applies, so agents only hear about rows they can read).
function useTableChanges(table, filter, onChange) {
  const callback = useRef(onChange);
  useEffect(() => {
    callback.current = onChange;
  });
  useEffect(() => {
    if (!supabase) return undefined;
    const channel = supabase
      .channel(`admin-${table}-${filter ?? "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table, ...(filter ? { filter } : {}) }, () => callback.current())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter]);
}

export default function ChatsPage() {
  const { chatId } = useParams();
  const [view, setView] = useState("open");
  const { data: chats, error, reload } = useAsync(() => listChats(view), view);
  useTableChanges("chat_conversations", null, reload);

  return (
    <>
      <PageHeader title="Live chat" description="Conversations from the help center widget. You appear online to visitors while this console is open." />
      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <aside className="rounded-lg border border-[var(--bluecore-border)] bg-white">
          <div role="tablist" aria-label="Chat views" className="flex border-b border-[var(--bluecore-border)] text-sm">
            {[
              ["open", "Open"],
              ["closed", "Closed"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={view === id}
                onClick={() => setView(id)}
                className={`flex-1 px-3 py-2 ${view === id ? "border-b-2 border-[var(--bluecore-primary)] font-medium" : "text-[var(--bluecore-text-secondary)]"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <ErrorBanner message={error} />
          <ul className="max-h-[32rem] divide-y divide-[var(--bluecore-border)] overflow-y-auto" aria-label="Conversations">
            {(chats ?? []).length === 0 && <li className="p-4 text-sm text-[var(--bluecore-text-muted)]">No conversations.</li>}
            {(chats ?? []).map((c) => (
              <li key={c.id}>
                <Link
                  to={`/admin/chats/${c.id}`}
                  aria-current={c.id === chatId ? "page" : undefined}
                  className={`block px-4 py-3 hover:bg-slate-50 ${c.id === chatId ? "bg-blue-50/60" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{c.visitor_name}</span>
                    <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                  </div>
                  <div className="truncate text-xs text-[var(--bluecore-text-muted)]">
                    {c.client?.name ?? c.visitor_email} · {formatDateTime(c.last_message_at)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        {chatId ? (
          <ChatThread key={chatId} chatId={chatId} />
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-[var(--bluecore-border-strong)] p-10 text-sm text-[var(--bluecore-text-muted)]">
            Choose a conversation.
          </div>
        )}
      </div>
    </>
  );
}

function ChatThread({ chatId }) {
  const { staff } = useAuth();
  const navigate = useNavigate();
  const canWork = canManageContacts(staff);
  const { data: chat, error, loading, reload } = useAsync(() => getChat(chatId), chatId);
  const [draft, setDraft] = useState("");
  const [actionError, setActionError] = useState("");
  const [visitorTyping, setVisitorTyping] = useState(false);
  const channelRef = useRef(null);
  const listRef = useRef(null);
  useTableChanges("chat_messages", `conversation_id=eq.${chatId}`, reload);

  // The visitor's broadcast channel: hear their typing, and ping them when we
  // reply so their widget refetches immediately.
  const channelKey = chat?.channel_key;
  useEffect(() => {
    if (!supabase || !channelKey) return undefined;
    let typingTimer;
    const channel = supabase
      .channel(visitorChannelName(channelKey))
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.from !== "visitor") return;
        setVisitorTyping(true);
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => setVisitorTyping(false), 4000);
      })
      .on("broadcast", { event: "new_message" }, () => setVisitorTyping(false))
      .subscribe();
    channelRef.current = channel;
    return () => {
      clearTimeout(typingTimer);
      supabase.removeChannel(channel);
    };
  }, [channelKey]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [chat?.chat_messages?.length, visitorTyping]);

  const lastTypingSent = useRef(0);
  function notifyTyping() {
    const now = Date.now();
    if (now - lastTypingSent.current < 2000) return;
    lastTypingSent.current = now;
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: { from: "agent" } });
  }

  async function act(fn) {
    setActionError("");
    try {
      await fn();
      channelRef.current?.send({ type: "broadcast", event: "new_message", payload: {} });
      await reload();
    } catch (err) {
      setActionError(describeError(err));
    }
  }

  async function handleSend(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    await act(() => sendAgentChatMessage(chat.id, staff, body));
  }

  if (loading) return <p className="text-sm text-[var(--bluecore-text-muted)]">Loading…</p>;
  if (error) return <ErrorBanner message={error} />;

  const closed = chat.status === "closed";
  return (
    <section className="flex min-h-[32rem] flex-col rounded-lg border border-[var(--bluecore-border)] bg-white" aria-label={`Chat with ${chat.visitor_name}`}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--bluecore-border)] p-4">
        <div>
          <h2 className="font-semibold text-[var(--bluecore-heading)]">{chat.visitor_name}</h2>
          <p className="text-xs text-[var(--bluecore-text-secondary)]">
            {chat.visitor_email}
            {chat.client && (
              <>
                {" · "}
                <Link to={`/admin/clients/${chat.client.id}`} className="text-[var(--bluecore-primary)] hover:underline">{chat.client.name}</Link>
              </>
            )}
            {chat.page_url && ` · from ${chat.page_url}`}
          </p>
          <p className="text-xs text-[var(--bluecore-text-muted)]">
            {chat.assignee ? `Handled by ${chat.assignee.full_name || chat.assignee.email}` : "Unassigned"}
          </p>
        </div>
        {canWork && (
          <div className="flex flex-wrap gap-2">
            {chat.ticket ? (
              <Link
                to={`/admin/tickets/${chat.ticket.id}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--bluecore-border-strong)] px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                <Ticket size={14} aria-hidden="true" /> {ticketRef(chat.ticket.number)}
              </Link>
            ) : (
              <Button
                variant="secondary"
                onClick={() =>
                  act(async () => {
                    const ticket = await convertChatToTicket(chat.id);
                    navigate(`/admin/tickets/${ticket.id}`);
                  })
                }
              >
                <Ticket size={14} aria-hidden="true" /> Convert to ticket
              </Button>
            )}
            {!chat.assignee_id && !closed && (
              <Button variant="secondary" onClick={() => act(() => updateChat(chat.id, { assignee_id: staff.id, status: "active" }))}>
                Take chat
              </Button>
            )}
            <Button variant="secondary" onClick={() => act(() => updateChat(chat.id, { status: closed ? "active" : "closed" }))}>
              {closed ? "Reopen" : "End chat"}
            </Button>
          </div>
        )}
      </header>
      <ErrorBanner message={actionError} />
      <ol ref={listRef} className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-4" aria-live="polite" aria-label="Messages">
        {chat.chat_messages.map((m) =>
          m.sender === "system" ? (
            <li key={m.id} className="text-center text-xs text-[var(--bluecore-text-muted)]">{m.body}</li>
          ) : (
            <li key={m.id} className={`flex ${m.sender === "agent" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  m.sender === "agent" ? "bg-[var(--bluecore-primary)] text-white" : "border border-[var(--bluecore-border)] bg-white"
                }`}
              >
                <div className={`mb-0.5 text-xs ${m.sender === "agent" ? "text-white/70" : "text-[var(--bluecore-text-muted)]"}`}>
                  {m.author_name} · {formatDateTime(m.created_at)}
                </div>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
              </div>
            </li>
          ),
        )}
        {visitorTyping && <li className="text-xs italic text-[var(--bluecore-text-muted)]">{chat.visitor_name} is typing…</li>}
      </ol>
      {canWork && !closed && (
        <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-[var(--bluecore-border)] p-3">
          <textarea
            rows={2}
            maxLength={4000}
            aria-label="Reply"
            placeholder={`Reply to ${chat.visitor_name}…`}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              notifyTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) handleSend(e);
            }}
            className="flex-1 resize-none rounded-md border border-[var(--bluecore-border-strong)] px-3 py-2 text-sm focus:border-[var(--bluecore-focus)] focus:outline-none"
          />
          <Button type="submit" disabled={!draft.trim()} aria-label="Send reply">
            <Send size={16} aria-hidden="true" />
          </Button>
        </form>
      )}
    </section>
  );
}
