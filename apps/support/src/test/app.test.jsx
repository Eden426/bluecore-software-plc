import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../App.jsx";

describe("support app shell", () => {
  it("renders the public help center with a contact link", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "How can we help?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /contact support/i })).toHaveAttribute("href", "mailto:team@blue-core.tech");
  });
});
