import { supabase } from "./supabase.js";

// Shared by the visitor widget and the agent console.
export const AGENTS_CHANNEL = "support-agents";
export const visitorChannelName = (channelKey) => `chat-visitor:${channelKey}`;

const STORAGE_KEY = "bluecore-support-chat";

// The visitor token is the only credential for a chat; keep it per browser.
export function loadSavedChat() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return saved?.token && saved?.channelKey ? saved : null;
  } catch {
    return null;
  }
}

export function saveChat(chat) {
  try {
    if (chat) localStorage.setItem(STORAGE_KEY, JSON.stringify(chat));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode etc.: the chat still works for this page view.
  }
}

async function call(path, { token, method = "GET", body } = {}) {
  const response = await fetch(path, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { "X-Chat-Token": token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || "Chat is unavailable right now.");
    error.status = response.status;
    error.fields = result.errors;
    throw error;
  }
  return result;
}

export const startChat = (details) => call("/api/chat/start", { method: "POST", body: details });
export const fetchChat = (token, after = 0) => call(`/api/chat/messages?after=${after}`, { token });
export const sendChatMessage = (token, body) => call("/api/chat/send", { method: "POST", token, body: { body } });

// Content-free pings on the visitor's broadcast channel. Visitors refetch
// through the API; nothing sensitive goes over the public channel.
export function pingVisitor(channel, event = "new_message", payload = {}) {
  return channel?.send({ type: "broadcast", event, payload });
}

export function realtimeAvailable() {
  return Boolean(supabase);
}
