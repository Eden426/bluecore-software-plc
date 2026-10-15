import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Preloader from "../components/Preloader";

describe("boot preloader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(performance, "now").mockReturnValue(100);
    vi.stubGlobal("requestAnimationFrame", callback => setTimeout(callback, 16));
    vi.stubGlobal("cancelAnimationFrame", id => clearTimeout(id));
    document.body.insertAdjacentHTML("afterbegin", '<div id="site-preloader" role="status"></div>');
  });
  afterEach(() => {
    document.getElementById("site-preloader")?.remove();
    vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  });
  it("fades and removes the existing overlay once under StrictMode", async () => {
    const overlay = document.getElementById("site-preloader");
    render(<StrictMode><Preloader /></StrictMode>);
    await Promise.resolve();
    vi.advanceTimersByTime(2582);
    expect(overlay).toHaveAttribute("data-state", "leaving");
    vi.advanceTimersByTime(240);
    expect(document.getElementById("site-preloader")).toBeNull();
  });
  it("skips the intro delay for reduced motion", async () => {
    vi.mocked(window.matchMedia).mockReturnValueOnce({ matches: true });
    render(<Preloader />);
    await Promise.resolve();
    vi.advanceTimersByTime(40);
    expect(document.getElementById("site-preloader")).toBeNull();
  });
  it("waits for the font before timing the intro", async () => {
    const overlay = document.getElementById("site-preloader");
    let ready;
    overlay.fontReady = new Promise(resolve => { ready = resolve; });
    render(<Preloader />);
    vi.advanceTimersByTime(4000);
    expect(overlay).not.toHaveAttribute("data-state");
    overlay.dataset.startedAt = "100";
    ready();
    await Promise.resolve();
    vi.advanceTimersByTime(2682);
    expect(overlay).toHaveAttribute("data-state", "leaving");
    vi.advanceTimersByTime(240);
    expect(document.getElementById("site-preloader")).toBeNull();
  });
  it("cleans up scheduled work when unmounted", () => {
    const overlay = document.getElementById("site-preloader");
    const { unmount } = render(<Preloader />);
    unmount(); vi.runAllTimers();
    expect(overlay).not.toHaveAttribute("data-state");
  });
});
