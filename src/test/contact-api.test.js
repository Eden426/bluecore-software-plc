// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler from "../../api/contact.js";
import vercel from "../../vercel.json";

const inquiry = { name: "Test User", email: "visitor@example.com", company: "", message: "Please discuss our new project.", website: "", requestId: "30e372d8-76c8-4d1f-8af7-b149a81ca3c8" };
const request = (body = inquiry, options = {}) => new Request("https://blue-core.tech/api/contact", {
  method: "POST", body: typeof body === "string" ? body : JSON.stringify(body),
  ...options, headers: { Origin: "https://blue-core.tech", "Content-Type": "application/json", ...options.headers },
});

describe("contact endpoint", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "test-server-key");
    vi.stubEnv("CONTACT_FROM_EMAIL", "website@inquiries.blue-core.tech");
    vi.stubEnv("CONTACT_TO_EMAIL", "team@blue-core.tech");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ id: "provider-id" })));
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

  it("sends escaped HTML and plain text with fixed routing and visitor reply-to", async () => {
    const response = await handler.fetch(request({ ...inquiry, name: "<b>Visitor</b>", company: "R&D", message: '<script>alert("x")</script>\nPlease reply.', to: "attacker@example.com", from: "attacker@example.com" }));
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ accepted: true });
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(options.headers.Authorization).toBe("Bearer test-server-key");
    const sent = JSON.parse(options.body);
    expect(sent).toMatchObject({ from: "Bluecore Website <website@inquiries.blue-core.tech>", to: ["team@blue-core.tech"], reply_to: inquiry.email });
    expect(sent.html).toContain("&lt;script&gt;");
    expect(sent.html).toContain("R&amp;D");
    expect(sent.html).not.toContain("<script>");
    expect(sent.text).toContain('<script>alert("x")</script>');
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("deduplicates retries across invocations while separating changed messages", async () => {
    await handler.fetch(request()); await handler.fetch(request());
    await handler.fetch(request({ ...inquiry, message: "A different inquiry message." }));
    const keys = fetch.mock.calls.map(([, options]) => options.headers["Idempotency-Key"]);
    expect(keys[0]).toBe(keys[1]); expect(keys[2]).not.toBe(keys[0]);
  });

  it.each([
    ["name", ""], ["name", "a"], ["name", "x".repeat(101)], ["name", "A\r\nB"],
    ["email", "invalid"], ["email", "v@example.com\r\nBcc:a@b.com"], ["email", "x".repeat(255)],
    ["email", "a..b@example.com"], ["email", ".test@example.com"], ["email", `${"a".repeat(65)}@example.com`],
    ["company", "x".repeat(201)], ["company", {}], ["message", "short"], ["message", "x".repeat(5001)],
    ["website", {}], ["requestId", "invalid"],
  ])("rejects invalid %s without sending", async (field, value) => {
    expect((await handler.fetch(request({ ...inquiry, [field]: value }))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([null, [], "bad json"])("rejects malformed payload %j", async body => {
    expect((await handler.fetch(request(body))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("silently discards honeypot submissions", async () => {
    expect((await handler.fetch(request({ ...inquiry, website: "https://bot.example" }))).status).toBe(202);
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(["https://attacker.example", "null", ""])("rejects origin %s", async origin => {
    expect((await handler.fetch(request(inquiry, { headers: { Origin: origin } }))).status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("restricts methods and content type", async () => {
    const get = await handler.fetch(new Request("https://blue-core.tech/api/contact"));
    expect(get.status).toBe(405); expect(get.headers.get("allow")).toBe("POST");
    expect((await handler.fetch(request(inquiry, { headers: { "Content-Type": "text/plain" } }))).status).toBe(415);
  });
  it("limits actual streamed bytes even without content-length", async () => {
    expect((await handler.fetch(request(" ".repeat(32769)))).status).toBe(413);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects oversized declared bodies before reading", async () => {
    expect((await handler.fetch(request(inquiry, { headers: { "Content-Length": "40000" } }))).status).toBe(413);
  });
  it.each(["RESEND_API_KEY", "CONTACT_FROM_EMAIL", "CONTACT_TO_EMAIL"])("fails safely without %s", async name => {
    vi.stubEnv(name, "");
    const response = await handler.fetch(request());
    expect(response.status).toBe(503); expect(fetch).not.toHaveBeenCalled();
    expect(await response.text()).not.toContain("test-server-key");
  });
  it.each([401, 429, 500])("hides provider errors (%s)", async status => {
    fetch.mockResolvedValue(Response.json({ message: "sensitive provider detail" }, { status }));
    const response = await handler.fetch(request());
    expect(response.status).toBe(502); expect(await response.text()).not.toMatch(/sensitive|test-server-key/);
  });
  it("handles timeouts without leaking raw exceptions", async () => {
    fetch.mockRejectedValue(new Error("private detail"));
    const response = await handler.fetch(request());
    expect(response.status).toBe(502); expect(await response.text()).not.toContain("private");
  });
  it("does not treat malformed provider success as acceptance", async () => {
    fetch.mockResolvedValue(Response.json({}));
    expect((await handler.fetch(request())).status).toBe(502);
  });
  it("keeps API paths outside the SPA rewrite", () => {
    const rewrite = new RegExp(`^${vercel.rewrites[0].source}$`);
    expect(rewrite.test("/api/contact")).toBe(false);
    expect(rewrite.test("/api/unknown")).toBe(false);
    expect(rewrite.test("/privacy")).toBe(true);
    expect(rewrite.test("/")).toBe(true);
  });
});
