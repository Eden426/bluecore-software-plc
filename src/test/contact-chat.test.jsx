import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Contact from "../components/Contact";
import SupportChat from "../components/SupportChat";


function fillContact() {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Test User" } });
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "test@example.com" } });
  fireEvent.change(screen.getByLabelText(/^message$/i), { target: { value: "A sufficiently detailed test message." } });
}

describe("contact form", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());
  it("shows accessible validation errors", () => {
    render(<Contact />);
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(screen.getByText(/correct the highlighted fields/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toHaveAttribute("aria-invalid", "true");
  });
  it("posts to the contact API and reports acceptance rather than delivery", async () => {
    fetch.mockResolvedValue({ status: 202, json: async () => ({ accepted: true }) });
    render(<Contact />); fillContact();
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    await waitFor(() => expect(screen.getByText(/accepted for sending/i)).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledWith("/api/contact", expect.objectContaining({ method: "POST" }));
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body).toMatchObject({ name: "Test User", email: "test@example.com", website: "" });
    expect(body).not.toHaveProperty("to");
    expect(screen.getByLabelText(/full name/i)).toHaveValue("");
  });
  it("preserves entries and hides provider details on failure", async () => {
    fetch.mockResolvedValue({ status: 502, json: async () => ({ error: "provider detail" }) });
    render(<Contact />); fillContact();
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    await waitFor(() => expect(screen.getByText(/could not send your message/i)).toBeInTheDocument());
    expect(screen.queryByText(/provider detail/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toHaveValue("Test User");
    expect(screen.getByRole("button", { name: /send message/i })).toBeEnabled();
  });
  it("prevents duplicate in-flight submissions and reuses the retry identifier", async () => {
    let reject;
    fetch.mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
    render(<Contact />); fillContact();
    const form = screen.getByRole("button", { name: /send message/i }).closest("form");
    fireEvent.submit(form); fireEvent.submit(form);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
    reject(new Error("network"));
    await screen.findByText(/could not send your message/i);
    fetch.mockResolvedValue({ status: 202, json: async () => ({ accepted: true }) });
    fireEvent.submit(form);
    await screen.findByText(/accepted for sending/i);
    expect(JSON.parse(fetch.mock.calls[1][1].body).requestId).toBe(JSON.parse(fetch.mock.calls[0][1].body).requestId);
  });
  it("handles non-JSON rate-limit responses without clearing input", async () => {
    fetch.mockResolvedValue({ status: 429 });
    render(<Contact />); fillContact();
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    await screen.findByText(/too many requests/i);
    expect(screen.getByLabelText(/email address/i)).toHaveValue("test@example.com");
  });
  it("does not call the API for honeypot submissions", () => {
    render(<Contact />); fillContact();
    fireEvent.change(screen.getByLabelText("Website"), { target: { value: "bot.example" } });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("support chat", () => {
  it("answers a common business question respectfully", async () => {
    render(<SupportChat />);
    fireEvent.click(screen.getByRole("button", { name: /open support chat/i }));
    const input = await screen.findByLabelText(/message for the bluecore quick-help assistant/i);
    fireEvent.change(input, { target: { value: "Can you explain your project process?" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(await screen.findByText(/discovery and requirements/i, {}, { timeout: 2000 })).toBeInTheDocument();
  });

  it("opens as a dialog and closes with Escape", async () => {
    render(<SupportChat />);
    fireEvent.click(screen.getByRole("button", { name: /open support chat/i }));
    const dialog = await screen.findByRole("dialog", { name: /bluecore support/i });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByLabelText(/message for the bluecore quick-help assistant/i)).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
