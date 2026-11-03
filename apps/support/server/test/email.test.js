// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildReplyEmail, headerValue, parseAddress, parseMessageIds, toIngestPayload } from "../email.js";

describe("email helpers", () => {
  it("parses addresses with and without display names", () => {
    expect(parseAddress('"Sara Tesfaye" <Sara@Addis.Example>')).toEqual({ email: "sara@addis.example", name: "Sara Tesfaye" });
    expect(parseAddress("ops@addis.example")).toEqual({ email: "ops@addis.example", name: "" });
  });

  it("reads headers case-insensitively and splits message ids", () => {
    const headers = { "In-Reply-To": "<a@x>", references: "<a@x>\r\n <b@y>" };
    expect(headerValue(headers, "in-reply-to")).toBe("<a@x>");
    expect(parseMessageIds(headerValue(headers, "References"))).toEqual(["<a@x>", "<b@y>"]);
  });

  it("maps a Resend received email to the ingest payload", () => {
    const payload = toIngestPayload({
      id: "re_1",
      from: "Sara <sara@addis.example>",
      to: ["support+abc@blue-core.tech"],
      received_for: ["support@blue-core.tech"],
      subject: "Help",
      text: "Body",
      html: "<p>Body</p>",
      message_id: "<m@addis.example>",
      headers: { "in-reply-to": "<prev@blue-core.tech>" },
    });
    expect(payload).toEqual({
      resend_email_id: "re_1",
      from_email: "sara@addis.example",
      from_name: "Sara",
      to: ["support+abc@blue-core.tech", "support@blue-core.tech"],
      subject: "Help",
      text: "Body",
      html: "<p>Body</p>",
      message_id: "<m@addis.example>",
      in_reply_to: "<prev@blue-core.tech>",
    });
  });

  it("builds a threaded reply with a per-ticket reply address", () => {
    const email = buildReplyEmail({
      ticket: { number: 1042, subject: "Printer", requester_email: "sara@addis.example", reply_token: "tok" },
      message: { body_text: "Fixed <now>" },
      agentName: "Aman",
      threadIds: ["<a@x>", "<b@y>"],
      config: { supportAddress: "support@blue-core.tech", fromAddress: "support@mail.blue-core.tech" },
      messageId: "<new@mail.blue-core.tech>",
    });
    expect(email.subject).toBe("Re: [BC-1042] Printer");
    expect(email.reply_to).toBe("support+tok@blue-core.tech");
    expect(email.headers).toEqual({ "Message-ID": "<new@mail.blue-core.tech>", "In-Reply-To": "<b@y>", References: "<a@x> <b@y>" });
    expect(email.html).toContain("Fixed &lt;now&gt;");
  });
});
