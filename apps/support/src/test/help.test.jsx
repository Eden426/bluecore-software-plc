import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../auth/authContext.js";
import { AppRoutes } from "../App.jsx";
import * as api from "../lib/api.js";
import { groupByCategory, splitHighlights } from "../lib/kb.js";

vi.mock("../lib/api.js", async (importOriginal) => ({
  ...(await importOriginal()),
  listPublishedArticles: vi.fn(),
  listFaqs: vi.fn(),
  getPublishedArticle: vi.fn(),
  listPublicProducts: vi.fn(),
  searchKb: vi.fn(),
  sendArticleFeedback: vi.fn(),
  listAllArticles: vi.fn(),
  listFeedbackTotals: vi.fn(),
  getArticle: vi.fn(),
  saveArticle: vi.fn(),
  listProducts: vi.fn(),
}));

const ARTICLE = {
  id: "a1",
  type: "article",
  title: "Resetting a user's password",
  slug: "resetting-a-users-password",
  summary: "Administrators can reset passwords.",
  body: "1. Open **Settings**\n\n<script>alert('x')</script>\n\n[Docs](https://example.com)",
  category: "Accounts",
  tags: [],
  updated_at: "2026-10-20T10:00:00Z",
  published_at: "2026-10-20T10:00:00Z",
};

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
  vi.mocked(api.listPublishedArticles).mockResolvedValue([ARTICLE]);
  vi.mocked(api.listFaqs).mockResolvedValue([
    { id: "f1", title: "What are your support hours?", slug: "support-hours", body: "Mon–Fri.", category: "General" },
  ]);
  vi.mocked(api.getPublishedArticle).mockResolvedValue(ARTICLE);
  vi.mocked(api.listPublicProducts).mockResolvedValue([{ id: "p1", name: "Bluecore Garage OS", slug: "garage-os", description: "" }]);
  vi.mocked(api.searchKb).mockResolvedValue([
    { id: "a1", type: "article", title: ARTICLE.title, slug: ARTICLE.slug, snippet: "choose <<Reset>> <<password>>" },
  ]);
  vi.mocked(api.sendArticleFeedback).mockResolvedValue();
  vi.mocked(api.listAllArticles).mockResolvedValue([{ ...ARTICLE, status: "draft", visibility: "public", product: null }]);
  vi.mocked(api.listFeedbackTotals).mockResolvedValue([]);
  vi.mocked(api.listProducts).mockResolvedValue([
    { id: "p1", name: "Bluecore Garage OS", kind: "shared" },
    { id: "p2", name: "Abay Patient Portal", kind: "bespoke" },
  ]);
  vi.mocked(api.saveArticle).mockResolvedValue({ id: "new-id", status: "draft" });
  vi.mocked(api.getArticle).mockResolvedValue({ ...ARTICLE, id: "new-id", status: "draft", visibility: "public", product_id: null, position: 0 });
});

describe("kb helpers", () => {
  it("splits search highlights without HTML", () => {
    expect(splitHighlights("choose <<Reset>> now")).toEqual([
      { text: "choose ", match: false },
      { text: "Reset", match: true },
      { text: " now", match: false },
    ]);
  });
  it("strips markdown from snippets but keeps highlights", () => {
    expect(splitHighlights("Open **Settings** and [read <<docs>>](https://x.test) ## Next")).toEqual([
      { text: "Open Settings and read ", match: false },
      { text: "docs", match: true },
      { text: " Next", match: false },
    ]);
  });
  it("groups by category in first-seen order", () => {
    expect(groupByCategory([{ category: "B" }, { category: "" }, { category: "B" }]).map(([k, v]) => [k, v.length])).toEqual([
      ["B", 2],
      ["General", 1],
    ]);
  });
});

describe("public help center", () => {
  it("searches from the home page and highlights matches", async () => {
    renderAt("/");
    await userEvent.type(screen.getByRole("searchbox", { name: "Search the help center" }), "reset password{Enter}");
    await waitFor(() => expect(api.searchKb).toHaveBeenCalledWith("reset password"));
    expect(await screen.findByText("1 result for “reset password”")).toBeInTheDocument();
    expect(screen.getByText("Reset", { selector: "mark" })).toBeInTheDocument();
  });

  it("renders article markdown without raw HTML and records feedback", async () => {
    const { container } = renderAt("/articles/resetting-a-users-password");
    expect(await screen.findByRole("heading", { name: ARTICLE.title, level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Settings", { selector: "strong" })).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("rel", "noopener noreferrer");
    await userEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(api.sendArticleFeedback).toHaveBeenCalledWith("a1", true);
    expect(await screen.findByText("Thanks for your feedback.")).toBeInTheDocument();
  });

  it("shows not found for unknown or unpublished articles", async () => {
    vi.mocked(api.getPublishedArticle).mockResolvedValue(null);
    renderAt("/articles/nope");
    expect(await screen.findByRole("heading", { name: "Article not found" })).toBeInTheDocument();
  });

  it("lists FAQs and product docs", async () => {
    renderAt("/faq");
    expect(await screen.findByText("What are your support hours?")).toBeInTheDocument();
  });

  it("loads docs for a product by slug", async () => {
    renderAt("/docs/garage-os");
    expect(await screen.findByRole("heading", { name: "Bluecore Garage OS documentation" })).toBeInTheDocument();
    await waitFor(() => expect(api.listPublishedArticles).toHaveBeenCalledWith("doc", { productId: "p1" }));
  });
});

describe("help center CMS", () => {
  const agent = { session: {}, status: "signed-in", staff: { id: "s1", email: "a@b.test", full_name: "Agent", role: "agent", active: true } };

  it("lists content for staff", async () => {
    renderAt("/admin/kb", agent);
    expect(await screen.findByRole("link", { name: ARTICLE.title })).toBeInTheDocument();
  });

  it("creates a draft with a derived slug", async () => {
    renderAt("/admin/kb/new", agent);
    await userEvent.type(await screen.findByRole("textbox", { name: "Title" }), "Exporting reports");
    await userEvent.type(screen.getByRole("textbox", { name: "Body (Markdown)" }), "Use **Export**.");
    await userEvent.click(screen.getByRole("tab", { name: "preview" }));
    expect(screen.getByText("Export", { selector: "strong" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(api.saveArticle).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ title: "Exporting reports", slug: "exporting-reports", status: "draft", author_id: "s1" }),
      ),
    );
  });

  it("makes docs for bespoke products internal by default", async () => {
    renderAt("/admin/kb/new", agent);
    await screen.findByRole("option", { name: "Abay Patient Portal (bespoke)" });
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Product" }), "p2");
    expect(screen.getByRole("combobox", { name: /^Visibility/ })).toHaveValue("internal");
  });
});
