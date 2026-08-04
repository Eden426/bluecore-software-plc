import { Resend } from "resend";

const CONTACT_RECIPIENT = "info@bluecoresoft.com";
const FROM_ADDRESS = "Bluecore Website <onboarding@resend.dev>";
const MAX_FIELD_LENGTH = 5000;

function isValidEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { name, email, company, message, website } = req.body ?? {};

  // Honeypot: a real visitor never fills this hidden field in.
  if (website) {
    return res.status(200).json({ ok: true });
  }

  if (
    typeof name !== "string" ||
    !name.trim() ||
    !isValidEmail(email) ||
    typeof message !== "string" ||
    !message.trim()
  ) {
    return res.status(400).json({ ok: false, error: "Please fill in your name, a valid email, and a message." });
  }

  if (
    name.length > MAX_FIELD_LENGTH ||
    message.length > MAX_FIELD_LENGTH ||
    (company && company.length > MAX_FIELD_LENGTH)
  ) {
    return res.status(400).json({ ok: false, error: "One of the fields is too long." });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return res.status(500).json({ ok: false, error: "Email is not configured on the server." });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: CONTACT_RECIPIENT,
      replyTo: email,
      subject: `New contact form message from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        company ? `Company: ${company}` : null,
        "",
        message,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    if (error) {
      console.error("Resend error:", error);
      return res.status(502).json({ ok: false, error: "Failed to send message." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Contact form send failed:", err);
    return res.status(500).json({ ok: false, error: "Failed to send message." });
  }
}
