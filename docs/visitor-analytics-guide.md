# Website Visitor & CTA Analytics Guide

This guide details the visitor analytics architecture for Bluecore Software PLC, comparing the best free options (zero cost beyond your existing Vercel Pro plan) and explaining how to view visitor insights and CTA metrics.

---

## 1. Executive Summary & Options Exploration

You requested visitor analytics without paying more than your existing **Vercel Pro** subscription. Here is how the top options compare:

| Provider | Cost with Vercel Pro | Privacy / Cookies | Setup Required | Visitor Demographics | CTA / Custom Event Tracking | Funnels / Replay |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Vercel Web Analytics** *(Active & Primary)* | **$0 / Included** in Vercel Pro | 100% Cookieless, GDPR/CCPA compliant | 1 click in Vercel Dashboard | Countries, regions, cities, OS, browsers, devices | Native via `@vercel/analytics` `track()` | Custom Events tab with counts & properties |
| **Vercel Speed Insights** *(Active)* | **$0 / Included** in Vercel Pro | Cookieless | Already active | Real user Core Web Vitals (LCP, INP, CLS, TTFB) | Performance-focused | Per-page & per-country latency |
| **Google Analytics 4 (GA4)** *(Supported as dual-mirror)* | **$0 Free forever** | Cookie-based (or Consent Mode) | Set `VITE_GA_MEASUREMENT_ID` | Detailed demographics, Google Search keywords | Custom conversion goals & events | Full multi-step funnel exploration |
| **PostHog Cloud (Free Tier)** | **$0** up to 1M events/mo | Cookie/localStorage | PostHog account & API key | Basic visitor stats | Autocapture & custom events | Session replay (5k/mo) & click heatmaps |
| **Cloudflare Web Analytics** | **$0** | Cookieless | DNS or JS snippet | High-level pageviews & referrers | Limited custom CTA tracking | Basic |

### The Chosen Solution: Unified Multi-Provider Architecture
We implemented a **unified analytics engine** (`src/lib/analytics.js`):
1. **Primary**: **Vercel Web Analytics + Speed Insights** (100% covered by Vercel Pro, 0 extra fees, zero third-party scripts, cookieless, sub-millisecond overhead).
2. **Optional Mirror**: **Google Analytics 4** (Zero extra cost). If you ever want GA4 for search query analytics or deep funnels, you simply set `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` in your Vercel Environment Variables. The codebase automatically mirrors all tracked CTAs and route views to GA4 without any code changes!

---

## 2. Standard Visitor Insights Available in Vercel Dashboard

When you open your project in the **Vercel Dashboard** and click **Analytics**, you get immediate access to:

1. **Traffic & Growth**:
   - **Unique Visitors** (deduplicated by privacy-preserving hash)
   - **Total Page Views**
   - **Visit Duration** and bounce metrics
   - **Real-Time Active Visitors**
2. **Visitor Acquisition & Referrers**:
   - Direct visits
   - Search engines (Google, Bing, etc.)
   - Social channels (LinkedIn, Telegram, WhatsApp, Facebook, X)
   - Referring websites
3. **Geographic Distribution**:
   - World map view
   - Breakdown by Country (e.g. Ethiopia, US, UK, etc.)
   - Breakdown by Region & City (e.g. Addis Ababa)
4. **Technology & Devices**:
   - Device categories (Mobile vs. Desktop vs. Tablet)
   - Operating Systems (iOS, Android, Windows, macOS, Linux)
   - Browsers (Chrome, Safari, Firefox, Edge, etc.)
5. **Top Content**:
   - Most visited pages (`/`, `/services/*`, `/portfolio/*`, `/blog/*`, `/support`, `/privacy`)
6. **Core Web Vitals (Speed Insights tab)**:
   - **LCP** (Largest Contentful Paint)
   - **FID / INP** (Interaction to Next Paint)
   - **CLS** (Cumulative Layout Shift)
   - **TTFB** (Time to First Byte)

---

## 3. CTA & Conversion Metrics Instrumented

All key user interactions and Call-to-Actions (CTAs) are instrumented using semantic tracking functions:

| Event Name | Location / Trigger | Parameters Tracked | Business Insight |
| :--- | :--- | :--- | :--- |
| `cta_click` | Hero "Contact Us" | `cta_label: "Contact Us"`, `cta_location: "hero"`, `target: "#contact"` | Hero conversion rate |
| `cta_click` | Navbar "Get Started" (Desktop) | `cta_label: "Get Started"`, `cta_location: "navbar_desktop"` | Primary header CTA clicks |
| `cta_click` | Navbar "Get Started" (Mobile) | `cta_label: "Get Started"`, `cta_location: "navbar_mobile_header"` | Mobile header CTA clicks |
| `cta_click` | Mobile Drawer "Get Started" | `cta_label: "Get Started"`, `cta_location: "navbar_mobile_drawer"` | Mobile drawer conversion |
| `cta_click` | Portfolio "Start Your Project" | `cta_label: "Start Your Project"`, `cta_location: "portfolio_header"` | Portfolio section intent |
| `cta_click` | Service Detail "Discuss This Service" | `cta_label: "Discuss This Service"`, `service: "..."`, `slug: "..."` | High-intent lead by service |
| `cta_click` | Portfolio Detail "Discuss Similar Project" | `cta_label: "Discuss Similar Project"`, `project: "..."` | Case study lead conversion |
| `cta_click` | Blog Post "Talk to Bluecore" | `cta_label: "Talk to Bluecore"`, `post: "..."` | Content marketing conversion |
| `cta_click` | Footer "Get in touch" | `cta_label: "Get in touch"`, `cta_location: "footer"` | Bottom-of-page CTA conversion |
| `cta_click` | About "Learn More About Us" | `cta_label: "Learn More About Us"`, `cta_location: "about_preview"` | Engagement with company story |
| `contact_form_submit` | Contact Form Submission | `status: "attempt" \| "success" \| "validation_error" \| "throttled" \| "error"`, `has_company: boolean` | Form completion funnel & drop-off (0 PII logged) |
| `contact_direct_click` | Direct Contact Links | `method: "email" \| "phone" \| "whatsapp" \| "telegram" \| "map"`, `value: "..."` | Direct inquiry channel preference |
| `support_chat_interaction` | Support Chat Assistant | `action: "open" \| "close" \| "minimize" \| "expand" \| "quick_action_click" \| "message_sent"`, `label: "..."` | Automated support engagement & top questions |
| `service_engagement` | Service Bento Cards | `service: "..."`, `slug: "..."`, `location: "bento_card"` | Most popular services |
| `portfolio_engagement` | Portfolio Project Cards | `project: "..."`, `slug: "..."`, `category: "..."` | Most viewed case studies |
| `navigation_click` | Navbar & Footer Navigation | `label: "..."`, `destination: "..."`, `menu_type: "navbar" \| "footer" \| "footer_legal"` | User journey and navigation flow |
| `theme_toggle` | Theme Switcher | `theme: "dark" \| "light"` | Visitor preference for dark vs. light mode |
| `outbound_click` | SchoolBridge, Social Links | `label: "..."`, `url: "..."` | Outbound referral traffic |

> **Privacy & Compliance Note:**  
> The contact form tracker records statuses and company presence flags only (`status: "success"`, `has_company: true`). It **never** logs personal data (names, email addresses, or message content), adhering strictly to GDPR, CCPA, and privacy best practices.

---

## 4. How to View Your Analytics in Vercel

1. **Log in to Vercel**:
   Go to [vercel.com](https://vercel.com) and navigate to your **bluecore-website** project.
2. **Open the Analytics Tab**:
   Click on the **Analytics** tab at the top of the dashboard.
   - If not previously activated, click **Enable Web Analytics** (included with your Pro plan).
3. **View Visitor Insights**:
   - Filter by date range (Today, Last 7 days, Last 30 days, Custom).
   - Inspect the **Visitors**, **Page Views**, **Top Pages**, and **Referrers**.
   - View the geographic interactive map of your audience.
4. **View CTA Metrics (Custom Events)**:
   - Click the **Events** (or **Custom Events**) tab within Web Analytics.
   - You will see the total count and timeline for each custom event:
     - `cta_click`
     - `contact_form_submit`
     - `support_chat_interaction`
     - `service_engagement`
     - `contact_direct_click`
   - Click on any event (e.g. `cta_click`) to inspect the parameter breakdown (e.g. which `cta_label` or `cta_location` received the most clicks).

---

## 5. (Optional) Enabling Google Analytics 4 (GA4) at $0 Cost

If you also want Google Analytics 4:
1. Go to [analytics.google.com](https://analytics.google.com) and create a free Property for `blue-core.tech`.
2. Under **Admin > Data Streams**, copy your **Measurement ID** (format: `G-XXXXXXXXXX`).
3. In your **Vercel Project Settings > Environment Variables**:
   - **Key**: `VITE_GA_MEASUREMENT_ID`
   - **Value**: `G-XXXXXXXXXX`
   - **Environments**: Production, Preview, Development
4. Redeploy. The website will automatically mirror all page views and custom CTA events directly into GA4 in real time!
