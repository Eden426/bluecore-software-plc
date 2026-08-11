# Bluecore Software PLC

Marketing website for Bluecore Software PLC — live at **[blue-core.tech](https://blue-core.tech)**.

A single-page site built with React 19, Vite, and Tailwind CSS v4. It's prerendered at build time so search engines and AI crawlers see full page content, not an empty shell.

## Tech stack

- **React 19 + Vite** — client-rendered SPA, no router (single page, anchor navigation)
- **Tailwind CSS v4** — utility styling, dark mode via a `.dark` class
- **Framer Motion** — scroll/interaction animations
- **EmailJS** — contact form submission (no backend server)
- **Vitest + Testing Library** — unit/component tests
- **Vercel Analytics & Speed Insights** — traffic and Core Web Vitals

## Commands

```bash
npm run dev       # start the Vite dev server
npm run build      # production build to dist/, then prerenders dist/index.html
npm run preview    # preview the production build
npm run lint       # eslint over the whole repo
npm test           # run the vitest suite
```

## Deployment

Every push to `main` runs through GitHub Actions (`.github/workflows/deploy.yml`): a `validate` job (lint, test, build) runs on every PR and push, and a `deploy` job builds and deploys to Vercel production once `validate` passes. See `CLAUDE.md` for the full architecture writeup, including why the build has a Puppeteer-based prerender step and how it stays compatible with both local development and CI.

## Contributing

Work happens on feature branches merged via pull request — CI (`validate`) must pass before merging to `main`.
