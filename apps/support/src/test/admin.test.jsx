import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../auth/authContext.js";
import { AppRoutes } from "../App.jsx";
import * as api from "../lib/api.js";
import { hasRole } from "../lib/permissions.js";
import { slugify } from "../lib/slugify.js";

vi.mock("../lib/api.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    listClients: vi.fn(),
    createClient: vi.fn(),
    listProducts: vi.fn(),
    listStaff: vi.fn(),
  };
});

const CLIENTS = [
  {
    id: "c1",
    name: "Addis Logistics",
    slug: "addis-logistics",
    sla_tier: "priority",
    active: true,
    client_domains: [{ domain: "addislogistics.example" }],
    client_products: [{ id: "d1" }],
  },
  {
    id: "c2",
    name: "Abay Health",
    slug: "abay-health",
    sla_tier: "enterprise",
    active: true,
    client_domains: [{ domain: "abayhealth.example" }],
    client_products: [],
  },
];

function staffOf(role, extra = {}) {
  return { id: "s1", email: `${role}@bluecore.test`, full_name: "", role, active: true, ...extra };
}

function renderAt(path, auth) {
  const value = { session: {}, status: "signed-in", signIn: vi.fn(), signOut: vi.fn(), ...auth };
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

beforeEach(() => {
  vi.mocked(api.listClients).mockResolvedValue(CLIENTS);
  vi.mocked(api.createClient).mockResolvedValue({});
  vi.mocked(api.listProducts).mockResolvedValue([]);
  vi.mocked(api.listStaff).mockResolvedValue([]);
});

describe("permissions", () => {
  it("ranks roles and ignores deactivated staff", () => {
    expect(hasRole(staffOf("admin"), "agent")).toBe(true);
    expect(hasRole(staffOf("agent"), "admin")).toBe(false);
    expect(hasRole(staffOf("viewer"), "viewer")).toBe(true);
    expect(hasRole(staffOf("admin", { active: false }), "viewer")).toBe(false);
    expect(hasRole(null, "viewer")).toBe(false);
  });

  it("slugifies names", () => {
    expect(slugify("  Abay Health & Co. ")).toBe("abay-health-co");
    expect(slugify("Café Ünïon")).toBe("cafe-union");
  });
});

describe("admin routes", () => {
  it("sends signed-out visitors to the login page", () => {
    renderAt("/admin/clients", { status: "signed-out", session: null, staff: null });
    expect(screen.getByRole("heading", { name: "Bluecore Support" })).toBeInTheDocument();
    expect(screen.getByText("Staff sign in")).toBeInTheDocument();
  });

  it("blocks deactivated staff", () => {
    renderAt("/admin/clients", { staff: staffOf("agent", { active: false }) });
    expect(screen.getByRole("heading", { name: "No staff access" })).toBeInTheDocument();
  });

  it("lists clients and filters by domain", async () => {
    renderAt("/admin", { staff: staffOf("viewer") });
    expect(await screen.findByRole("link", { name: "Addis Logistics" })).toBeInTheDocument();
    await userEvent.type(screen.getByRole("searchbox", { name: "Search clients" }), "abayhealth");
    expect(screen.queryByRole("link", { name: "Addis Logistics" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abay Health" })).toBeInTheDocument();
  });

  it("hides admin controls from viewers", async () => {
    renderAt("/admin/clients", { staff: staffOf("viewer") });
    await screen.findByRole("link", { name: "Addis Logistics" });
    expect(screen.queryByRole("button", { name: /new client/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Staff" })).not.toBeInTheDocument();
  });

  it("lets admins create a client with a derived slug", async () => {
    renderAt("/admin/clients", { staff: staffOf("admin") });
    await userEvent.click(await screen.findByRole("button", { name: /new client/i }));
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Lalibela Tours");
    expect(screen.getByRole("textbox", { name: /slug/i })).toHaveValue("lalibela-tours");
    await userEvent.click(screen.getByRole("button", { name: "Create client" }));
    await waitFor(() =>
      expect(api.createClient).toHaveBeenCalledWith({
        name: "Lalibela Tours",
        slug: "lalibela-tours",
        sla_tier: "standard",
      }),
    );
  });

  it("shows a friendly message for duplicate clients", async () => {
    vi.mocked(api.createClient).mockRejectedValue({ code: "23505", message: "duplicate key" });
    renderAt("/admin/clients", { staff: staffOf("admin") });
    await userEvent.click(await screen.findByRole("button", { name: /new client/i }));
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Abay Health");
    await userEvent.click(screen.getByRole("button", { name: "Create client" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/already exists/i);
  });

  it("redirects non-admins away from the staff page", async () => {
    renderAt("/admin/staff", { staff: staffOf("agent") });
    expect(await screen.findByRole("heading", { name: "Clients" })).toBeInTheDocument();
  });
});
