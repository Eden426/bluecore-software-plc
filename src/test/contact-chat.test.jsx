import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import emailjs from "@emailjs/browser";
import Contact from "../components/Contact";
import SupportChat from "../components/SupportChat";

vi.mock("@emailjs/browser", () => ({ default: { send: vi.fn() } }));

function fillContact() {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Test User" } });
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "test@example.com" } });
  fireEvent.change(screen.getByLabelText(/^message$/i), { target: { value: "A sufficiently detailed test message." } });
}

describe("contact form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_EMAILJS_SERVICE_ID", "test-service");
    vi.stubEnv("VITE_EMAILJS_TEMPLATE_ID", "test-template");
    vi.stubEnv("VITE_EMAILJS_PUBLIC_KEY", "test-public-key");
  });
  it("shows accessible validation errors", () => {
    render(<Contact />);
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(screen.getByText(/correct the highlighted fields/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toHaveAttribute("aria-invalid", "true");
  });
  it("shows success after EmailJS resolves", async () => {
    emailjs.send.mockResolvedValue({ status: 200 });
    render(<Contact />); fillContact();
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    await waitFor(() => expect(screen.getByText(/sent successfully/i)).toBeInTheDocument());
  });
  it("shows a generic error after EmailJS rejects", async () => {
    emailjs.send.mockRejectedValue(new Error("provider detail"));
    render(<Contact />); fillContact();
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    await waitFor(() => expect(screen.getByText(/could not send your message/i)).toBeInTheDocument());
    expect(screen.queryByText(/provider detail/i)).not.toBeInTheDocument();
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
