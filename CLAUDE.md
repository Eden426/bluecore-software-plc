# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A marketing website for Bluecore Software PLC, built with React 19 + Vite + Tailwind CSS v4, live at blue-core.tech. There is no router library — `App.jsx` reads `window.location.pathname` directly and switch-renders one of: the home page (a stack of `<section>` components linked by in-page anchors: `#home`, `#about`, `#services`, `#portfolio`, `#contact`), a legal/support page (`/privacy`, `/terms`, `/support`, rendered by `LegalPage`), or `NotFoundPage` for anything else.

## Commands

```bash
npm run dev       # start Vite dev server
npm run build      # production build to dist/, then prerenders dist/index.html (see below)
npm run preview    # preview the production build
npm run lint       # eslint over the whole repo
npm test           # run the vitest suite (jsdom + Testing Library)
```

Test files live in `src/test/` (e.g. `theme-navigation.test.jsx`, `contact-chat.test.jsx`). Run a single file with `npx vitest run src/test/theme-navigation.test.jsx`, or `npx vitest` for watch mode.

`npm run build` is `vite build && node scripts/prerender.mjs` — the prerender step spins up a static server over `dist/`, loads `/` in headless Chrome, and overwrites `dist/index.html` with the fully rendered DOM (`document.documentElement.outerHTML`). This exists because the app is client-rendered only (`main.jsx` uses `createRoot`, not `hydrateRoot`/SSR), so the raw `vite build` output ships an empty `<div id="root">` — fine for browsers and JS-executing crawlers (Googlebot), but most AI crawlers (GPTBot, ClaudeBot, PerplexityBot, CCBot) fetch HTML without running JS and would otherwise see none of the page copy. Because `main.jsx` still calls `createRoot(...).render()` on load, real users' browsers discard the prerendered DOM and re-render client-side as normal — the prerendered HTML only matters for the first non-JS fetch. **The prerender script only renders `/`** (single `waitForSelector("#root section")` against the home page) — `/privacy`, `/terms`, and `/support` are not prerendered, so non-JS crawlers fetching those routes directly still see an empty shell. If you add a new route/page that should be crawlable without JS, extend `scripts/prerender.mjs` to render it too.

`scripts/prerender.mjs` launches its browser two different ways depending on environment (see `launchBrowser()`): on CI/Vercel (`process.env.CI` or `process.env.VERCEL` set) it uses `puppeteer-core` + `@sparticuz/chromium`, a Chromium build statically compiled for restricted serverless/CI Linux containers — plain `puppeteer`'s bundled Chromium fails there with missing shared libraries (`libnspr4.so` etc.). Locally it falls back to full `puppeteer`, which downloads a Chromium that runs on the host OS (`@sparticuz/chromium`'s binary is Linux-only and can't launch on macOS). Both packages are devDependencies for this reason — don't remove either without checking which environments still need it.

### Deployment

`.github/workflows/deploy.yml` runs on every push and PR to `main` with two jobs:
- `validate` (runs on PRs and pushes): `npm ci`, `npm run lint`, `npm test`, `npm run build`.
- `deploy` (runs only on push to `main`, after `validate` passes): `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`, i.e. the build (including the prerender step, using the CI/`@sparticuz` path above) happens in the Actions runner, not in Vercel's own build container — Vercel's native build container has the same missing-shared-library problem plain `puppeteer` had, and using `--prebuilt` sidesteps it entirely regardless of which Chromium strategy is in play.

The workflow needs `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` configured as repo secrets (values in `.vercel/project.json` for the latter two once linked). Vercel's native GitHub integration (auto-build-on-push via Vercel's own container) is intentionally not used here.

For manual/local deploys: `vercel build --prod` then `vercel deploy --prebuilt --prod` (same reasoning — avoids Vercel's build container running Puppeteer).

## Architecture

- **Composition root / routing**: `src/main.jsx` wraps `App` in `ThemeProvider`. `src/App.jsx` does its own pathname-based branching (no router library): `legalPages` (a `Set` of `/privacy`, `/terms`, `/support`) renders `LegalPage`, `/` renders the home page's section stack in order (`Navbar`, `Hero`, `AboutPreview`, `Stats`, `Services`, `Portfolio`, `Testimonials`, `Contact`, `Footer`, plus `SupportChat`/`Analytics`/`SpeedInsights` outside the switch), and everything else renders `NotFoundPage`. `App.jsx` also hand-rolls per-route `<title>`/meta-description/canonical/OG/Twitter tag updates (`routeMetadata`, `useRouteMetadata`) and a hash-scroll effect (`useHashScroll`) that re-implements the browser's native fragment-scroll behavior, which client-side rendering destroys (see the comments above those functions in `App.jsx` for why). To reorder or add a home-page section, edit the JSX inside the `path === "/"` branch; to add a new top-level route, add it to `routeMetadata` and branch on it explicitly — there's no route config file.
- **Theming**: dark mode is a `.dark` class on `<html>`, toggled via `src/context/ThemeProvider.jsx` and read anywhere with the `useTheme()` hook (`src/context/useTheme.js`). Dark is the default for first-time visitors (no saved preference); the choice persists to `localStorage` under `THEME_STORAGE_KEY` from `src/constants/theme.js`. The context object/provider/hook are split into three files (`themeContext.js`, `ThemeProvider.jsx`, `useTheme.js`) — this split exists because Vite's React Fast Refresh requires files that export components to only export components, so the raw context and the hook live outside `ThemeProvider.jsx`.
- **Tailwind v4 setup**: Tailwind is imported via `@import "tailwindcss";` directly in `src/index.css`, not configured through `tailwind.config.js`'s `theme` block (that file mainly declares `content` globs). Dark-mode variants use a custom variant `@custom-variant dark (&:where(.dark, .dark *));` also defined in `index.css`, so `dark:` utility classes key off the `.dark` class rather than `prefers-color-scheme`. Brand colors are CSS custom properties on `:root` in `index.css` (`--bluecore-blue`, `--bluecore-primary`, `--bluecore-accent-blue`, `--bluecore-brown`, `--bluecore-accent-brown`, `--bluecore-text`, `--bluecore-border`, etc.) alongside hardcoded hex values used directly in component `className` strings (e.g. `#06243f`, `#8B5E3C`, `#09090B`) — when changing brand colors, check both places.
- **Content/presentation split**: copy and structured content for repeatable sections lives in `src/data/` (`portfolio.js`, `services.js`) rather than inline in JSX, so editing the portfolio list or service catalog means editing data files, not component markup. `services.js` entries can carry an optional `hero: true` flag plus `heroTagline`/`heroExtended` fields that `Services.jsx` uses to render one featured/expanded card differently from the rest.
- **Icons**: `src/components/icons/ServiceIcons.jsx` exports custom inline SVG icon components (`IconAI`, `IconCloudOps`, `IconIntegration`, etc.) used by both `services.js` entries and `Hero.jsx`'s badge row. General-purpose UI icons (menu, sun/moon, contact icons) come from `lucide-react` instead.
- **No backend/no API**: home-page navigation is same-page anchor scrolling (`html { scroll-behavior: smooth; }` in `index.css`); the contact form and `SupportChat` submit via EmailJS from the browser, with no server-side handler in this repo.
