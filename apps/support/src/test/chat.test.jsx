import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../auth/authContext.js";
import { AppRoutes } from "../App.jsx";
import * as api from "../lib/api.js";
import * as chat from "../lib/chat.js";

vi.mock("../lib/chat.js", async (importOriginal) => ({
  ...(await importOriginal()),
  startChat: vi.fn(),
  fetchChat: vi.fn(),
  sendChatMessage: vi.fn(),
}));
vi.mock("../lib/api.js", async (importOriginal) => ({
  ...(await importOriginal()),
  listPublishedArticles: vi.fn(async () => []),
  listChats: vi.fn(),
  getChat: vi.fn(),
  sendAgentChatMessage: vi.fn(),
  updateChat: vi.fn(),
  convertChatToTicket: vi.fn(),
  countWaitingChats: vi.fn(async () => 0),
}));

const VISITOR_VIEW = {
  status: "active",
  ticketNumber: null,
  messages: [
    { id: 1, sender: "visitor", author_name: "Hana", body: "Login fails", created_at: "2026-10-22T10:00:00Z" },
    { id: 2, sender: "agent", author_name: "Aman", body: "Checking now", created_at: "2026-10-22T10:01:00Z" },
  ],
};

const CHAT = {
  id: "c1",
  channel_key: "k1",
  visitor_name: "Hana",
  visitor_email: "hana@addis.example",
  status: "waiting",
  assignee_id: null,
  assignee: null,
  client: { id: "cl1", name: "Addis Logistics" },
  ticket: null,
  page_url: "/kb",
  last_message_at: "2026-10-22T10:00:00Z",
  chat_messages: [{ id: 1, sender: "visitor", author_name: "Hana", body: "Login fails", created_at: "2026-10-22T10:00:00Z" }],
};

const AGENT = { id: "s1", email: "agent@bluecore.test", full_name: "Agent Smith", role: "agent", active: true };

function renderAt(path, auth = { session: null, status: "signed-out", staff: null }) {
  return render(
    <AuthContext.Provider value={{ signIn: vi.fn(), signOut: vi.fn(), ...auth }}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(chat.startChat).mockResolvedValue({ token: "t".repeat(43), channelKey: "k1" });
  vi.mocked(chat.fetchChat).mockResolvedValue(VISITOR_VIEW);
  vi.mocked(chat.sendChatMessage).mockResolvedValue({ id: 3 });
  vi.mocked(api.listChats).mockResolvedValue([CHAT]);
  vi.mocked(api.getChat).mockResolvedValue(CHAT);
  vi.mocked(api.sendAgentChatMessage).mockResolvedValue({});
  vi.mocked(api.updateChat).mockResolvedValue({});
  vi.mocked(api.convertChatToTicket).mockResolvedValue({ id: "t9", number: 1099 });
});

describe("visitor chat widget", () => {
  it("starts a chat, remembers it, and shows the conversation", async () => {
    renderAt("/");
    await userEvent.click(screen.getByRole("button", { name: "Chat with support" }));
    const panel = screen.getByRole("region", { name: "Live chat" });
    await userEvent.type(within(panel).getByRole("textbox", { name: "Name" }), "Hana");
    await userEvent.type(within(panel).getByRole("textbox", { name: "Work email" }), "hana@addis.example");
    await userEvent.type(within(panel).getByRole("textbox", { name: "How can we help?" }), "Login fails");
    await userEvent.click(within(panel).getByRole("button", { name: "Start chat" }));
    await waitFor(() =>
      expect(chat.startChat).toHaveBeenCalledWith({ name: "Hana", email: "hana@addis.example", message: "Login fails", pageUrl: "/" }),
    );
    expect(await within(panel).findByText("Checking now")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("bluecore-support-chat"))).toEqual({ token: "t".repeat(43), channelKey: "k1" });
  });

  it("sends messages with the saved token", async () => {
    localStorage.setItem("bluecore-support-chat", JSON.stringify({ token: "t".repeat(43), channelKey: "k1" }));
    renderAt("/");
    await userEvent.click(screen.getByRole("button", { name: "Chat with support" }));
    await userEvent.type(await screen.findByRole("textbox", { name: "Message" }), "Still broken{Enter}");
    await waitFor(() => expect(chat.sendChatMessage).toHaveBeenCalledWith("t".repeat(43), "Still broken"));
  });

  it("shows the ticket reference when a chat ends", async () => {
    localStorage.setItem("bluecore-support-chat", JSON.stringify({ token: "t".repeat(43), channelKey: "k1" }));
    vi.mocked(chat.fetchChat).mockResolvedValue({ ...VISITOR_VIEW, status: "closed", ticketNumber: 1099 });
    renderAt("/");
    await userEvent.click(screen.getByRole("button", { name: "Chat with support" }));
    expect(await screen.findByText(/Your reference is BC-1099/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Start a new chat" }));
    expect(localStorage.getItem("bluecore-support-chat")).toBeNull();
    expect(screen.getByRole("button", { name: "Start chat" })).toBeInTheDocument();
  });
});

describe("agent chat console", () => {
  const auth = { session: {}, status: "signed-in", staff: AGENT };

  it("lists waiting chats and replies", async () => {
    renderAt("/admin/chats/c1", auth);
    expect(await screen.findByRole("heading", { name: "Hana" })).toBeInTheDocument();
    await userEvent.type(screen.getByRole("textbox", { name: "Reply" }), "Hi Hana{Enter}");
    await waitFor(() => expect(api.sendAgentChatMessage).toHaveBeenCalledWith("c1", AGENT, "Hi Hana"));
  });

  it("takes and ends chats", async () => {
    renderAt("/admin/chats/c1", auth);
    await userEvent.click(await screen.findByRole("button", { name: "Take chat" }));
    await waitFor(() => expect(api.updateChat).toHaveBeenCalledWith("c1", { assignee_id: "s1", status: "active" }));
    await userEvent.click(screen.getByRole("button", { name: "End chat" }));
    await waitFor(() => expect(api.updateChat).toHaveBeenCalledWith("c1", { status: "closed" }));
  });

  it("converts a chat to a ticket and opens it", async () => {
    renderAt("/admin/chats/c1", auth);
    await userEvent.click(await screen.findByRole("button", { name: /convert to ticket/i }));
    await waitFor(() => expect(api.convertChatToTicket).toHaveBeenCalledWith("c1"));
  });

  it("is read-only for viewers", async () => {
    renderAt("/admin/chats/c1", { ...auth, staff: { ...AGENT, role: "viewer" } });
    await screen.findByRole("heading", { name: "Hana" });
    expect(screen.queryByRole("textbox", { name: "Reply" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /convert to ticket/i })).not.toBeInTheDocument();
  });
});
