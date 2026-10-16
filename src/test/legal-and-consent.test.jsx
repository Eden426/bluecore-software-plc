import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import LegalPage from "../components/LegalPage";
import CookieBanner from "../components/CookieBanner";
import {
  CONSENT_STORAGE_KEY,
  getConsentState,
  setConsentState,
  initAnalytics,
  openCookieBanner,
} from "../lib/analytics";

describe("mandatory disclosures & legal page", () => {
  it("renders statutory corporate disclosures in Terms of Use", () => {
    render(<LegalPage page="terms" />);

    // Verify entity name and legal form
    expect(screen.getByRole("heading", { level: 1, name: /Terms of Use & Statutory Disclosures/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Bluecore Software PLC/i).length).toBeGreaterThan(0);

    // Verify statutory registration and licensing details
    expect(screen.getByText(/AACATB\/14\/672\/50471350\/2018/i)).toBeInTheDocument();
    expect(screen.getByText(/Addis Ababa City Trade Bureau/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Federal Democratic Republic of Ethiopia/i).length).toBeGreaterThan(0);

    // Verify contact disclosures
    expect(screen.getByText(/team@blue-core.tech/i)).toBeInTheDocument();
    expect(screen.getByText(/\+251 978 939 312/i)).toBeInTheDocument();

    // Verify dispute resolution and governing law
    expect(screen.getByRole("heading", { name: /Governing Law and Dispute Resolution/i })).toBeInTheDocument();
    expect(screen.getByText(/exclusive jurisdiction of the competent courts of Addis Ababa/i)).toBeInTheDocument();
  });

  it("renders privacy policy with GA4, cookies table, and data subject rights", () => {
    render(<LegalPage page="privacy" />);

    expect(screen.getByRole("heading", { level: 1, name: /Privacy Policy & Data Protection Notice/i })).toBeInTheDocument();

    // Verify data controller identity
    expect(screen.getByText(/AACATB\/14\/672\/50471350\/2018/i)).toBeInTheDocument();

    // Verify Google Analytics 4 and Vercel Analytics disclosures
    expect(screen.getByText(/G-VVMVSLLBVB/i)).toBeInTheDocument();
    expect(screen.getByText(/Vercel Web Analytics/i)).toBeInTheDocument();

    // Verify Cookie table rows
    expect(screen.getByText("_ga")).toBeInTheDocument();
    expect(screen.getByText("_ga_VVMVSLLBVB")).toBeInTheDocument();
    expect(screen.getByText("bluecore_cookie_consent")).toBeInTheDocument();
    expect(screen.getByText("theme")).toBeInTheDocument();

    // Verify data subject rights
    expect(screen.getByText(/Right of Access/i)).toBeInTheDocument();
    expect(screen.getByText(/Right to Rectification/i)).toBeInTheDocument();
    expect(screen.getByText(/Right to Erasure/i)).toBeInTheDocument();
    expect(screen.getByText(/Right to Withdraw Consent/i)).toBeInTheDocument();

    // Verify button to update cookie settings
    expect(screen.getByRole("button", { name: /Update Cookie Settings/i })).toBeInTheDocument();
  });

  it("renders customer support page with direct communication channels", () => {
    render(<LegalPage page="support" />);

    expect(screen.getByRole("heading", { level: 1, name: /Customer Support & Service Contacts/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /\+251 978 939 312/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /team@blue-core.tech/i })).toBeInTheDocument();
  });
});

describe("cookie & analytics consent banner", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    delete window.__gaInitialized;
  });

  it("shows banner when no prior consent has been registered", () => {
    vi.useFakeTimers();
    render(<CookieBanner />);

    // Fast-forward mount timer
    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.getByRole("region", { name: /Cookie and analytics notice/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Accept Analytics/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Essential Only/i })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("does not show banner if visitor has already accepted or declined", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");
    vi.useFakeTimers();
    render(<CookieBanner />);

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.queryByRole("region", { name: /Cookie and analytics notice/i })).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("records 'accepted' choice in localStorage and dismisses banner", () => {
    vi.useFakeTimers();
    render(<CookieBanner />);

    act(() => {
      vi.advanceTimersByTime(700);
    });

    const acceptBtn = screen.getByRole("button", { name: /Accept Analytics/i });
    act(() => {
      fireEvent.click(acceptBtn);
    });

    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("accepted");
    expect(getConsentState()).toBe("accepted");
    expect(screen.queryByRole("region", { name: /Cookie and analytics notice/i })).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("records 'declined' choice in localStorage and dismisses banner", () => {
    vi.useFakeTimers();
    render(<CookieBanner />);

    act(() => {
      vi.advanceTimersByTime(700);
    });

    const declineBtn = screen.getByRole("button", { name: /Essential Only/i });
    act(() => {
      fireEvent.click(declineBtn);
    });

    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("declined");
    expect(getConsentState()).toBe("declined");
    expect(screen.queryByRole("region", { name: /Cookie and analytics notice/i })).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("reopens banner when openCookieBanner is called", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");
    render(<CookieBanner />);

    expect(screen.queryByRole("region", { name: /Cookie and analytics notice/i })).not.toBeInTheDocument();

    act(() => {
      openCookieBanner();
    });

    expect(screen.getByRole("region", { name: /Cookie and analytics notice/i })).toBeInTheDocument();
  });
});

describe("analytics consent controls", () => {
  beforeEach(() => {
    localStorage.clear();
    delete window.__gaInitialized;
    const gaId = "G-VVMVSLLBVB";
    delete window[`ga-disable-${gaId}`];
  });

  it("disables GA4 when setConsentState is called with 'declined'", () => {
    const originalEnv = import.meta.env.VITE_GA_MEASUREMENT_ID;
    import.meta.env.VITE_GA_MEASUREMENT_ID = "G-VVMVSLLBVB";

    setConsentState("declined");

    expect(getConsentState()).toBe("declined");
    expect(window["ga-disable-G-VVMVSLLBVB"]).toBe(true);

    import.meta.env.VITE_GA_MEASUREMENT_ID = originalEnv;
  });

  it("enables GA4 and initializes when setConsentState is called with 'accepted'", () => {
    const originalEnv = import.meta.env.VITE_GA_MEASUREMENT_ID;
    import.meta.env.VITE_GA_MEASUREMENT_ID = "G-VVMVSLLBVB";

    setConsentState("accepted");

    expect(getConsentState()).toBe("accepted");
    expect(window["ga-disable-G-VVMVSLLBVB"]).toBe(false);
    expect(window.__gaInitialized).toBe(true);

    import.meta.env.VITE_GA_MEASUREMENT_ID = originalEnv;
  });

  it("does not initialize GA4 if visitor explicitly declined consent", () => {
    setConsentState("declined");
    initAnalytics("G-VVMVSLLBVB");

    expect(window.__gaInitialized).toBeUndefined();
    expect(window["ga-disable-G-VVMVSLLBVB"]).toBe(true);
  });
});
