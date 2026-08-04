import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import Navbar from "../components/Navbar";
import { ThemeProvider } from "../context/ThemeProvider";

function renderNavbar() { return render(<ThemeProvider><Navbar /></ThemeProvider>); }

describe("theme and navigation", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("uses dark mode by default for a first visit", () => {
    renderNavbar();
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem("bluecore-theme")).toBe("dark");
  });

  it("restores a saved light-mode choice after a refresh", () => {
    localStorage.setItem("bluecore-theme", "light");
    renderNavbar();
    expect(document.documentElement).not.toHaveClass("dark");
    expect(screen.getAllByRole("button", { name: /switch to dark mode/i })).toHaveLength(2);
    expect(localStorage.getItem("bluecore-theme")).toBe("light");
  });

  it("restores and toggles the persisted theme", () => {
    localStorage.setItem("bluecore-theme", "dark");
    renderNavbar();
    const toggles = screen.getAllByRole("button", { name: /switch to light mode/i });
    expect(document.documentElement).toHaveClass("dark");
    fireEvent.click(toggles[0]);
    expect(document.documentElement).not.toHaveClass("dark");
    expect(localStorage.getItem("bluecore-theme")).toBe("light");
  });

  it("opens the mobile menu and closes it with Escape", () => {
    renderNavbar();
    const button = screen.getByRole("button", { name: /open navigation menu/i });
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /close navigation menu/i })).toHaveAttribute("aria-controls", "mobile-navigation");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });
});
