# Bluecore Software PLC

Monorepo for Bluecore Software PLC's web properties (npm workspaces):

| Path | What |
| --- | --- |
| `apps/web` | Marketing website — live at **[blue-core.tech](https://blue-core.tech)** |
| `apps/support` | Support center + admin console (help center, ticketing, live chat, booking) — in development, planned for support.blue-core.tech |
| `packages/brand` | Shared brand tokens (CSS custom properties) |

The marketing site is a single-page site built with React 19, Vite, and Tailwind CSS v4. It's prerendered at build time so search engines and AI crawlers see full page content, not an empty shell.

## Tech stack

- **React 19 + Vite** — client-rendered SPA, no router (single page, anchor navigation)
- **Tailwind CSS v4** — utility styling, dark mode via a `.dark` class
- **Framer Motion** — scroll/interaction animations
- **Resend + Vercel Function** — server-side contact form submission ([setup checklist](apps/web/docs/contact-setup.md))
- **Vitest + Testing Library** — unit/component tests
- **Vercel Analytics & Speed Insights** — traffic and Core Web Vitals

## Commands

```bash
npm install           # once, at the repo root (installs every workspace)
npm run dev           # marketing site dev server (apps/web)
npm run dev:support   # support app dev server (apps/support)
npm run build         # build every workspace (web also prerenders into apps/web/dist)
npm run lint          # eslint in every workspace
npm test              # vitest in every workspace
```

## Deployment

Every push to `main` runs through GitHub Actions (`.github/workflows/deploy.yml`): a `validate` job (lint, test, build) runs on every PR and push, and a `deploy` job builds `apps/web` and deploys it to Vercel production once `validate` passes. See `CLAUDE.md` for the full architecture writeup, including why the build has a Puppeteer-based prerender step and how it stays compatible with both local development and CI.

## Contributing

Work happens on feature branches merged via pull request — CI (`validate`) must pass before merging to `main`.
