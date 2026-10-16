import { track as vercelTrack } from "@vercel/analytics";

/**
 * Checks whether execution is happening in a client browser environment.
 */
const isBrowser = typeof window !== "undefined";

/**
 * Initialize optional external providers (e.g., Google Analytics 4)
 * if configured via environment variables. Vercel Web Analytics is initialized
 * automatically via the <Analytics /> React component.
 */
export function initAnalytics() {
  if (!isBrowser) return;

  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (gaId && !window.__gaInitialized) {
    window.__gaInitialized = true;
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", gaId, {
      send_page_view: false,
    });
  }
}

/**
 * Core dispatch function.
 * Sends events to Vercel Web Analytics and any optional configured providers.
 *
 * @param {string} name - Event name (e.g. 'cta_click', 'contact_form_submit')
 * @param {Record<string, string | number | boolean | null>} [properties={}] - Event metadata
 */
export function trackEvent(name, properties = {}) {
  if (!isBrowser || !name) return;

  // 1. Dispatch to Vercel Web Analytics
  try {
    vercelTrack(name, properties);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(`[analytics] Vercel tracking error for "${name}":`, err);
    }
  }

  // 2. Dispatch to GA4 if active
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, properties);
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(`[analytics] GA4 tracking error for "${name}":`, err);
    }
  }

  // 3. Local development logging
  if (import.meta.env.DEV) {
    console.debug(`[analytics:event] ${name}`, properties);
  }
}

/**
 * Track Call-to-Action (CTA) clicks across the website.
 *
 * @param {string} label - Name or text of the CTA (e.g. "Contact Us", "Get Started")
 * @param {string} location - UI location (e.g. "hero", "navbar_desktop", "footer")
 * @param {Record<string, string | number | boolean>} [extra={}] - Additional context (e.g. target: "#contact")
 */
export function trackCTA(label, location, extra = {}) {
  trackEvent("cta_click", {
    cta_label: label,
    cta_location: location,
    ...extra,
  });
}

/**
 * Track contact form submission lifecycle.
 * Note: Never includes user PII (names, emails, messages) to remain 100% GDPR compliant.
 *
 * @param {"attempt" | "validation_error" | "success" | "error" | "throttled"} status
 * @param {Record<string, string | number | boolean>} [metadata={}]
 */
export function trackContactSubmission(status, metadata = {}) {
  trackEvent("contact_form_submit", {
    status,
    ...metadata,
  });
}

/**
 * Track direct communication clicks (Email, Phone, WhatsApp, Telegram, Map).
 *
 * @param {"email" | "phone" | "whatsapp" | "telegram" | "map"} method
 * @param {string} value
 */
export function trackDirectContact(method, value) {
  trackEvent("contact_direct_click", {
    method,
    value,
  });
}

/**
 * Track interactions with the floating quick-help / support chat assistant.
 *
 * @param {"open" | "close" | "minimize" | "quick_action" | "message_sent"} action
 * @param {Record<string, string | number | boolean>} [details={}]
 */
export function trackSupportChat(action, details = {}) {
  trackEvent("support_chat_interaction", {
    action,
    ...details,
  });
}

/**
 * Track user interest and engagement with service offerings.
 *
 * @param {string} serviceTitle
 * @param {string} slug
 * @param {string} location
 */
export function trackServiceEngagement(serviceTitle, slug, location = "card") {
  trackEvent("service_engagement", {
    service: serviceTitle,
    slug,
    location,
  });
}

/**
 * Track user interest in portfolio projects and case studies.
 *
 * @param {string} projectTitle
 * @param {string} slug
 * @param {string} category
 */
export function trackPortfolioEngagement(projectTitle, slug, category) {
  trackEvent("portfolio_engagement", {
    project: projectTitle,
    slug,
    category,
  });
}

/**
 * Track navigation clicks.
 *
 * @param {string} label
 * @param {string} destination
 * @param {string} menuType - "navbar" | "mobile_menu" | "footer"
 */
export function trackNavigation(label, destination, menuType = "navbar") {
  trackEvent("navigation_click", {
    label,
    destination,
    menu_type: menuType,
  });
}

/**
 * Track theme switch (dark/light mode).
 *
 * @param {"dark" | "light"} newTheme
 */
export function trackThemeToggle(newTheme) {
  trackEvent("theme_toggle", {
    theme: newTheme,
  });
}

/**
 * Track outbound external links (e.g. partner sites, SchoolBridge).
 *
 * @param {string} label
 * @param {string} url
 */
export function trackOutboundLink(label, url) {
  trackEvent("outbound_click", {
    label,
    url,
  });
}

/**
 * Track client-side page views (used for GA4 if active; Vercel Analytics handles automatically).
 *
 * @param {string} path
 * @param {string} [title]
 */
export function trackPageView(path, title) {
  if (!isBrowser) return;

  if (typeof window.gtag === "function" && import.meta.env.VITE_GA_MEASUREMENT_ID) {
    window.gtag("event", "page_view", {
      page_path: path,
      page_title: title || document.title,
    });
  }
}
