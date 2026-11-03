import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../auth/authContext.js";
import { AppRoutes } from "../App.jsx";
import * as api from "../lib/api.js";
import { slaState } from "../lib/tickets.js";

vi.mock("../lib/api.js", async (importOriginal) => ({
  ...(await importOriginal()),
  listTickets: vi.fn(),
  listClients: vi.fn(),
  listProducts: vi.fn(),
  listAssignableStaff: vi.fn(),
  getTicket: vi.fn(),
  updateTicket: vi.fn(),
  sendReply: vi.fn(),
  addInternalNote: vi.fn(),
  createStaffTicket: vi.fn(),
}));

const NOW = Date.now();
const iso = (minutes) => new Date(NOW + minutes * 60000).toISOString();

const TICKET = {
  id: "t1",
  number: 1042,
  subject: "Invoices not printing",
  status: "new",
  priority: "high",
  channel: "email",
  requester_email: "sara@addis.example",
  requester_name: "Sara",
  tags: [],
  client_id: "c1",
  product_id: null,
  assignee_id: null,
  client: { id: "c1", name: "Addis Logistics" },
  assignee: null,
  first_response_due_at: iso(-30),
  resolution_due_at: iso(600),
  first_responded_at: null,
  created_at: iso(-300),
  updated_at: iso(-5),
  ticket_messages: [
    { id: "m1", kind: "customer", author_name: "Sara", author_email: "sara@addis.example", body_text: "They fail since 9am.", created_at: iso(-300) },
    { id: "m2", kind: "note", author_name: "Aman", body_text: "Printer driver update?", created_at: iso(-200) },
  ],
  ticket_events: [{ id: 1, event: "created", to_value: "email", created_at: iso(-300) }],
};

const AGENT = { id: "s1", email: "agent@bluecore.test", full_name: "Agent Smith", role: "agent", active: true };

function renderAt(path, staff = AGENT) {
  return render(
    <AuthContext.Provider value={{ session: {}, status: "signed-in", staff, signIn: vi.fn(), signOut: vi.fn() }}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.listTickets).mockResolvedValue([TICKET]);
  vi.mocked(api.listClients).mockResolvedValue([{ id: "c1", name: "Addis Logistics", client_domains: [], client_products: [] }]);
  vi.mocked(api.listProducts).mockResolvedValue([]);
  vi.mocked(api.listAssignableStaff).mockResolvedValue([AGENT]);
  vi.mocked(api.getTicket).mockResolvedValue(TICKET);
  vi.mocked(api.updateTicket).mockResolvedValue({});
  vi.mocked(api.sendReply).mockResolvedValue({});
  vi.mocked(api.addInternalNote).mockResolvedValue({});
});

describe("SLA state", () => {
  it("flags an overdue first reply, then tracks resolution after replying", () => {
    expect(slaState(TICKET, new Date(NOW))).toMatchObject({ tone: "red", breached: true, label: "reply overdue 30m" });
    expect(slaState({ ...TICKET, first_responded_at: iso(-10) }, new Date(NOW)).label).toBe("resolve in 10h 0m");
    expect(slaState({ ...TICKET, status: "solved" }).label).toBe("Done");
  });
});

describe("ticket console", () => {
  it("opens on the ticket queue and shows SLA breaches", async () => {
    renderAt("/admin");
    expect(await screen.findByRole("link", { name: "Invoices not printing" })).toBeInTheDocument();
    expect(screen.getByText("reply overdue 30m")).toBeInTheDocument();
    expect(api.listTickets).toHaveBeenCalledWith(expect.objectContaining({ view: "open" }));
  });

  it("switches views and searches", async () => {
    renderAt("/admin/tickets");
    await userEvent.click(await screen.findByRole("tab", { name: "My open" }));
    await waitFor(() => expect(api.listTickets).toHaveBeenLastCalledWith(expect.objectContaining({ view: "mine", assigneeId: "s1" })));
  });

  it("shows the conversation with internal notes marked", async () => {
    renderAt("/admin/tickets/t1");
    expect(await screen.findByText("They fail since 9am.")).toBeInTheDocument();
    expect(screen.getByText("Printer driver update?")).toBeInTheDocument();
    expect(screen.getByLabelText("Only visible to staff")).toBeInTheDocument();
  });

  it("sends a reply and moves the ticket to pending", async () => {
    renderAt("/admin/tickets/t1");
    await userEvent.type(await screen.findByRole("textbox", { name: "Reply" }), "Please restart the print service.");
    await userEvent.click(screen.getByRole("button", { name: "Send reply" }));
    await waitFor(() => expect(api.sendReply).toHaveBeenCalledWith("t1", "Please restart the print service."));
    expect(api.updateTicket).toHaveBeenCalledWith("t1", { status: "pending" });
  });

  it("adds an internal note without emailing", async () => {
    renderAt("/admin/tickets/t1");
    await userEvent.click(await screen.findByRole("tab", { name: /internal note/i }));
    await userEvent.type(screen.getByRole("textbox", { name: "Internal note" }), "Escalating to dev.");
    await userEvent.click(screen.getByRole("button", { name: "Add note" }));
    await waitFor(() => expect(api.addInternalNote).toHaveBeenCalledWith("t1", AGENT, "Escalating to dev."));
    expect(api.sendReply).not.toHaveBeenCalled();
  });

  it("assigns the ticket from the triage panel", async () => {
    renderAt("/admin/tickets/t1");
    await userEvent.selectOptions(await screen.findByRole("combobox", { name: "Assignee" }), "s1");
    await waitFor(() => expect(api.updateTicket).toHaveBeenCalledWith("t1", { assignee_id: "s1" }));
  });

  it("is read-only for viewers", async () => {
    renderAt("/admin/tickets/t1", { ...AGENT, role: "viewer" });
    await screen.findByText("They fail since 9am.");
    expect(screen.queryByRole("button", { name: "Send reply" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Status" })).toBeDisabled();
  });
});
