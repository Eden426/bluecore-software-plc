import { describe, it, expect, vi, beforeEach } from "vitest";
import * as vercelAnalytics from "@vercel/analytics";
import {
  trackEvent,
  trackCTA,
  trackContactSubmission,
  trackDirectContact,
  trackSupportChat,
  trackServiceEngagement,
  trackPortfolioEngagement,
  trackNavigation,
  trackThemeToggle,
  trackOutboundLink,
  trackPageView,
  initAnalytics,
} from "../lib/analytics";

vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

describe("analytics module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.gtag;
    delete window.dataLayer;
    delete window.__gaInitialized;
  });

  it("calls vercelTrack with name and properties", () => {
    trackEvent("test_event", { key: "value" });
    expect(vercelAnalytics.track).toHaveBeenCalledWith("test_event", { key: "value" });
  });

  it("safely handles empty name or undefined properties", () => {
    trackEvent("", { key: "value" });
    expect(vercelAnalytics.track).not.toHaveBeenCalled();

    trackEvent("valid_event");
    expect(vercelAnalytics.track).toHaveBeenCalledWith("valid_event", {});
  });

  it("forwards events to window.gtag if present", () => {
    window.gtag = vi.fn();
    trackEvent("custom_goal", { conversion: true });
    expect(vercelAnalytics.track).toHaveBeenCalledWith("custom_goal", { conversion: true });
    expect(window.gtag).toHaveBeenCalledWith("event", "custom_goal", { conversion: true });
  });

  it("safely recovers if vercelTrack throws", () => {
    vi.mocked(vercelAnalytics.track).mockImplementationOnce(() => {
      throw new Error("Network offline");
    });
    expect(() => trackEvent("failing_event")).not.toThrow();
  });

  it("correctly tracks CTA clicks", () => {
    trackCTA("Get Started", "navbar_desktop", { target: "#contact" });
    expect(vercelAnalytics.track).toHaveBeenCalledWith("cta_click", {
      cta_label: "Get Started",
      cta_location: "navbar_desktop",
      target: "#contact",
    });
  });

  it("correctly tracks contact form submissions without exposing PII", () => {
    trackContactSubmission("success", { has_company: true });
    expect(vercelAnalytics.track).toHaveBeenCalledWith("contact_form_submit", {
      status: "success",
      has_company: true,
    });
  });

  it("correctly tracks direct contact link clicks", () => {
    trackDirectContact("email", "team@blue-core.tech");
    expect(vercelAnalytics.track).toHaveBeenCalledWith("contact_direct_click", {
      method: "email",
      value: "team@blue-core.tech",
    });
  });

  it("correctly tracks support chat actions", () => {
    trackSupportChat("quick_action", { label: "What services do you provide?" });
    expect(vercelAnalytics.track).toHaveBeenCalledWith("support_chat_interaction", {
      action: "quick_action",
      label: "What services do you provide?",
    });
  });

  it("correctly tracks service engagement", () => {
    trackServiceEngagement("AI Solutions", "ai-solutions", "bento_grid");
    expect(vercelAnalytics.track).toHaveBeenCalledWith("service_engagement", {
      service: "AI Solutions",
      slug: "ai-solutions",
      location: "bento_grid",
    });
  });

  it("correctly tracks portfolio engagement", () => {
    trackPortfolioEngagement("Bluecore ERP", "bluecore-erp-solutions", "Web App");
    expect(vercelAnalytics.track).toHaveBeenCalledWith("portfolio_engagement", {
      project: "Bluecore ERP",
      slug: "bluecore-erp-solutions",
      category: "Web App",
    });
  });

  it("correctly tracks navigation clicks", () => {
    trackNavigation("Services", "/#services", "navbar");
    expect(vercelAnalytics.track).toHaveBeenCalledWith("navigation_click", {
      label: "Services",
      destination: "/#services",
      menu_type: "navbar",
    });
  });

  it("correctly tracks theme toggling", () => {
    trackThemeToggle("light");
    expect(vercelAnalytics.track).toHaveBeenCalledWith("theme_toggle", {
      theme: "light",
    });
  });

  it("correctly tracks outbound links", () => {
    trackOutboundLink("SchoolBridge", "https://schoolbridge.et/");
    expect(vercelAnalytics.track).toHaveBeenCalledWith("outbound_click", {
      label: "SchoolBridge",
      url: "https://schoolbridge.et/",
    });
  });

  it("handles trackPageView with gtag", () => {
    window.gtag = vi.fn();
    const originalEnv = import.meta.env.VITE_GA_MEASUREMENT_ID;
    import.meta.env.VITE_GA_MEASUREMENT_ID = "G-TEST123456";

    trackPageView("/blog", "Blog | Bluecore");
    expect(window.gtag).toHaveBeenCalledWith("event", "page_view", {
      page_path: "/blog",
      page_title: "Blog | Bluecore",
    });

    import.meta.env.VITE_GA_MEASUREMENT_ID = originalEnv;
  });

  it("initializes GA4 when VITE_GA_MEASUREMENT_ID is defined", () => {
    const originalEnv = import.meta.env.VITE_GA_MEASUREMENT_ID;
    import.meta.env.VITE_GA_MEASUREMENT_ID = "G-INIT123";

    initAnalytics();

    expect(window.__gaInitialized).toBe(true);
    expect(typeof window.gtag).toBe("function");

    // Second call should be a no-op due to deduplication guard
    initAnalytics();
    expect(window.__gaInitialized).toBe(true);

    import.meta.env.VITE_GA_MEASUREMENT_ID = originalEnv;
  });
});

