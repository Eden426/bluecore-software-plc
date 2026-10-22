import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../App.jsx";

describe("support app shell", () => {
  it("renders the public home page with a contact link", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Bluecore Support" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "team@blue-core.tech" })).toHaveAttribute(
      "href",
      "mailto:team@blue-core.tech",
    );
  });
});
