import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());
if (typeof window !== "undefined") {
  window.matchMedia = vi.fn().mockImplementation((query) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  window.HTMLElement.prototype.scrollIntoView = vi.fn();

  const store = new Map();
  const localStorageMock = {
    getItem: vi.fn((key) => (store.has(key) ? store.get(key) : null)),
    setItem: vi.fn((key, value) => store.set(key, String(value))),
    removeItem: vi.fn((key) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    get length() { return store.size; },
    key: vi.fn((i) => Array.from(store.keys())[i] ?? null),
  };
  Object.defineProperty(window, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, configurable: true, writable: true });
}

