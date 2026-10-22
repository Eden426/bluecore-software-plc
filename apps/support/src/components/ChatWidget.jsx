import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { supabase } from "../lib/supabase.js";
import {
  AGENTS_CHANNEL,
  fetchChat,
  loadSavedChat,
  saveChat,
  sendChatMessage,
  startChat,
  visitorChannelName,
} from "../lib/chat.js";

const POLL_MS = 15_000;

// Floating live-chat widget for the public help center. Visitors don't sign
// in: the server hands out a per-chat token (see apps/support/api/chat).
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState(loadSavedChat);
  const agentsOnline = useAgentsOnline(open);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <section
          aria-label="Live chat"
          className="flex h-[min(34rem,calc(100vh-6rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-[var(--bluecore-border)] bg-white shadow-2xl"
        >
          <header className="flex items-center justify-between bg-[var(--bluecore-blue)] px-4 py-3 text-white">
            <div>
              <h2 className="text-sm font-semibold">Chat with Bluecore</h2>
              <p className="flex items-center gap-1.5 text-xs text-white/80">
                <span className={`h-2 w-2 rounded-full ${agentsOnline ? "bg-emerald-400" : "bg-white/40"}`} aria-hidden="true" />
                {agentsOnline ? "We're online" : "We're away. Leave a message and we'll email you"}
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="rounded p-1 hover:bg-white/10">
              <X size={18} aria-hidden="true" />
            </button>
          </header>
          {chat ? (
            <Conversation
              chat={chat}
              onEnded={() => {
                saveChat(null);
                setChat(null);
              }}
            />
          ) : (
            <StartForm
              onStarted={(started) => {
                saveChat(started);
                setChat(started);
              }}
            />
          )}
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Hide chat" : "Chat with support"}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bluecore-primary)] text-white shadow-lg hover:bg-[var(--bluecore-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--bluecore-focus)]"
      >
        {open ? <X size={22} aria-hidden="true" /> : <MessageCircle size={24} aria-hidden="true" />}
      </button>
    </div>
  );
}

// Count of agents with the console open (Realtime presence, read-only here).
function useAgentsOnline(enabled) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled || !supabase) return undefined;
    const channel = supabase.channel(AGENTS_CHANNEL);
    channel.on("presence", { event: "sync" }, () => setCount(Object.keys(channel.presenceState()).length)).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled]);
  return count > 0;
}

function StartForm({ onStarted }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setErrors({});
    try {
      const { token, channelKey } = await startChat({ ...form, pageUrl: window.location.pathname });
      onStarted({ token, channelKey });
    } catch (err) {
      setError(err.message);
      setErrors(err.fields ?? {});
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-md border border-[var(--bluecore-border-strong)] px-3 py-2 text-sm focus:border-[var(--bluecore-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--bluecore-focus)]/20";
  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 text-sm">
      <p className="text-[var(--bluecore-text-secondary)]">Tell us what you need. We'll reply here, or by email if you leave.</p>
      {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-red-800">{error}</p>}
      <label className="block">
        <span className="mb-1 block font-medium">Name</span>
        <input required autoComplete="name" className={input} value={form.name} onChange={set("name")} aria-invalid={Boolean(errors.name)} />
      </label>
      <label className="block">
        <span className="mb-1 block font-medium">Work email</span>
        <input required type="email" autoComplete="email" className={input} value={form.email} onChange={set("email")} aria-invalid={Boolean(errors.email)} />
      </label>
      <label className="block flex-1">
        <span className="mb-1 block font-medium">How can we help?</span>
        <textarea required rows={4} maxLength={4000} className={input} value={form.message} onChange={set("message")} aria-invalid={Boolean(errors.message)} />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-[var(--bluecore-primary)] px-3 py-2 font-medium text-white hover:bg-[var(--bluecore-primary-hover)] disabled:opacity-50"
      >
        {busy ? "Starting…" : "Start chat"}
      </button>
    </form>
  );
}

function Conversation({ chat, onEnded }) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("waiting");
  const [ticketNumber, setTicketNumber] = useState(null);
  const [agentTyping, setAgentTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  // Kept separate so a background refresh doesn't hide a failed send.
  const [sendError, setSendError] = useState("");
  const lastId = useRef(0);
  const channelRef = useRef(null);
  const listRef = useRef(null);
  // The parent passes an inline callback; keep it out of refresh's deps so the
  // subscription effect doesn't re-run on every render.
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  });

  const refresh = useCallback(async () => {
    try {
      const result = await fetchChat(chat.token, lastId.current);
      setStatus(result.status);
      setTicketNumber(result.ticketNumber);
      if (result.messages.length) {
        lastId.current = result.messages[result.messages.length - 1].id;
        setMessages((prev) => [...prev, ...result.messages.filter((m) => !prev.some((p) => p.id === m.id))]);
      }
      setError("");
    } catch (err) {
      if (err.status === 404) onEndedRef.current();
      else setError(err.message);
    }
  }, [chat.token]);

  // Initial load, a broadcast ping for instant updates, and slow polling as a
  // fallback if Realtime is unavailable.
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    let channel;
    if (supabase) {
      let typingTimer;
      channel = supabase
        .channel(visitorChannelName(chat.channelKey))
        .on("broadcast", { event: "new_message" }, () => {
          setAgentTyping(false);
          refresh();
        })
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          if (payload?.from !== "agent") return;
          setAgentTyping(true);
          clearTimeout(typingTimer);
          typingTimer = setTimeout(() => setAgentTyping(false), 4000);
        })
        .subscribe();
      channelRef.current = channel;
    }
    return () => {
      clearInterval(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [chat.channelKey, refresh]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, agentTyping]);

  const lastTypingSent = useRef(0);
  function notifyTyping() {
    const now = Date.now();
    if (now - lastTypingSent.current < 2000) return;
    lastTypingSent.current = now;
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: { from: "visitor" } });
  }

  async function handleSend(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    setSendError("");
    try {
      await sendChatMessage(chat.token, body);
      channelRef.current?.send({ type: "broadcast", event: "new_message", payload: {} });
      await refresh();
    } catch (err) {
      setDraft(body);
      setSendError(`Not sent: ${err.message}`);
    }
  }

  const closed = status === "closed";
  return (
    <>
      <ol ref={listRef} className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3" aria-live="polite" aria-label="Messages">
        {messages.map((m) =>
          m.sender === "system" ? (
            <li key={m.id} className="px-2 text-center text-xs text-[var(--bluecore-text-muted)]">{m.body}</li>
          ) : (
            <li key={m.id} className={`flex ${m.sender === "visitor" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.sender === "visitor" ? "bg-[var(--bluecore-primary)] text-white" : "border border-[var(--bluecore-border)] bg-white"
                }`}
              >
                {m.sender === "agent" && <div className="mb-0.5 text-xs font-medium text-[var(--bluecore-accent-brown)]">{m.author_name}</div>}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
              </div>
            </li>
          ),
        )}
        {status === "waiting" && messages.length > 0 && (
          <li className="px-2 text-center text-xs text-[var(--bluecore-text-muted)]">Waiting for an agent to join…</li>
        )}
        {agentTyping && <li className="px-2 text-xs italic text-[var(--bluecore-text-muted)]">Agent is typing…</li>}
      </ol>
      {(sendError || error) && <p role="alert" className="bg-red-50 px-3 py-1.5 text-xs text-red-800">{sendError || error}</p>}
      {closed ? (
        <div className="space-y-2 border-t border-[var(--bluecore-border)] p-3 text-center text-sm">
          <p className="text-[var(--bluecore-text-secondary)]">
            This chat has ended{ticketNumber ? `. Your reference is BC-${ticketNumber}` : ""}.
          </p>
          <button type="button" onClick={onEnded} className="text-[var(--bluecore-primary)] underline">Start a new chat</button>
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-[var(--bluecore-border)] p-2">
          <textarea
            rows={1}
            maxLength={4000}
            aria-label="Message"
            placeholder="Type a message…"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              notifyTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) handleSend(e);
            }}
            className="max-h-28 flex-1 resize-none rounded-md border border-[var(--bluecore-border-strong)] px-3 py-2 text-sm focus:border-[var(--bluecore-focus)] focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!draft.trim()}
            className="rounded-md bg-[var(--bluecore-primary)] p-2.5 text-white disabled:opacity-40"
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </form>
      )}
    </>
  );
}
