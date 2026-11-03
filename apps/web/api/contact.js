import { createHash } from "node:crypto";
import { CONTACT_LIMITS, isEmail, validateContact } from "../src/lib/contactValidation.js";

const MAX_BYTES = 32 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const json = (status, body, headers = {}) => Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

async function readBody(request) {
  if (Number(request.headers.get("content-length")) > MAX_BYTES) throw new RangeError();
  if (!request.body) throw new SyntaxError();
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); throw new RangeError(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export default {
  async fetch(request) {
    if (request.method !== "POST") return json(405, { error: "Method not allowed." }, { Allow: "POST" });
    // Defense in depth, not bot authentication: enable the documented WAF rule.
    if (request.headers.get("origin") !== new URL(request.url).origin || request.headers.get("sec-fetch-site") === "cross-site") return json(403, { error: "Request not allowed." });
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return json(415, { error: "Use application/json." });
    let body;
    try { body = await readBody(request); }
    catch (error) { return json(error instanceof RangeError ? 413 : 400, { error: "Invalid or oversized request." }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json(400, { error: "Invalid request." });
    if (typeof body.website !== "string" || body.website.length > CONTACT_LIMITS.website) return json(400, { error: "Invalid request." });
    // Silently discard honeypot submissions without contacting the provider.
    if (body.website.trim()) return json(202, { accepted: true });
    const errors = validateContact({ company: "", ...body });
    if (Object.keys(errors).length) return json(400, { error: "Please check your entries.", errors });
    if (typeof body.requestId !== "string" || !UUID.test(body.requestId)) return json(400, { error: "Invalid request identifier." });
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.CONTACT_FROM_EMAIL?.trim();
    const to = process.env.CONTACT_TO_EMAIL?.trim();
    // Exactly one bare mailbox per configuration value; never use submitted recipients.
    if (!apiKey || !isEmail(from) || !isEmail(to)) return json(503, { error: "Contact service temporarily unavailable." });
    const name = body.name.trim(), email = body.email.trim(), company = body.company?.trim() || "Not provided", message = body.message.trim();
    const payload = {
      from: `Bluecore Website <${from}>`, to: [to], reply_to: email,
      subject: "New Bluecore website inquiry",
      text: `Name: ${name}\nEmail: ${email}\nCompany: ${company}\n\nMessage:\n${message}`,
      html: `<h2>New Bluecore website inquiry</h2><p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Company:</strong> ${escapeHtml(company)}</p><p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\r?\n/g, "<br>")}</p>`,
    };
    // Resend stores idempotency keys for 24h across all serverless instances.
    const key = createHash("sha256").update(JSON.stringify([body.requestId, payload])).digest("hex");
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST", signal: AbortSignal.timeout(10_000),
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `contact-${key}` },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        console.error("Contact provider rejected request", { status: response.status });
        return json(502, { error: "We could not submit your inquiry. Please try again later." });
      }
      const result = await response.json();
      if (typeof result.id !== "string" || !result.id) throw new Error("Invalid provider response");
      return json(202, { accepted: true });
    } catch {
      // Never log provider bodies, visitor data, credentials, or raw errors.
      console.error("Contact provider unavailable");
      return json(502, { error: "We could not submit your inquiry. Please try again later." });
    }
  },
};
