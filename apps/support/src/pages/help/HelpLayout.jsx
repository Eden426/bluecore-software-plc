import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { Mail, Search } from "lucide-react";
import { SUPPORT_EMAIL } from "../../lib/config.js";
import { KB_TYPES } from "../../lib/kb.js";

export function SearchBox({ initial = "", large = false }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initial);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      }}
      className="relative w-full"
    >
      <Search
        size={large ? 20 : 16}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--bluecore-text-muted)]"
      />
      <input
        type="search"
        aria-label="Search the help center"
        placeholder="Search articles, FAQs and docs"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={`w-full rounded-lg border border-[var(--bluecore-border-strong)] bg-white text-[var(--bluecore-text)] focus:border-[var(--bluecore-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--bluecore-focus)]/20 ${
          large ? "py-3 pl-11 pr-4 text-base shadow-sm" : "py-1.5 pl-9 pr-3 text-sm"
        }`}
      />
    </form>
  );
}

export default function HelpLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-[var(--bluecore-border)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/" className="text-lg font-semibold text-[var(--bluecore-heading)]">
            Bluecore <span className="font-normal text-[var(--bluecore-text-secondary)]">Support</span>
          </Link>
          <nav aria-label="Help center" className="order-last -mx-2.5 flex w-full gap-1 overflow-x-auto text-sm sm:order-none sm:mx-0 sm:w-auto sm:flex-1">
            {Object.values(KB_TYPES).map(({ label, path }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-md px-2.5 py-1.5 ${
                    isActive ? "bg-slate-100 font-medium text-[var(--bluecore-heading)]" : "text-[var(--bluecore-text-secondary)] hover:text-[var(--bluecore-text)]"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-[var(--bluecore-primary)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--bluecore-primary-hover)]"
          >
            <Mail size={14} aria-hidden="true" /> Contact support
          </a>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-[var(--bluecore-border)] bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-6 text-sm text-[var(--bluecore-text-secondary)]">
          <span>© {new Date().getFullYear()} Bluecore Software PLC</span>
          <span className="flex gap-4">
            <a className="hover:underline" href="https://blue-core.tech">blue-core.tech</a>
            <a className="hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </span>
        </div>
      </footer>
    </div>
  );
}

// Shared page frame: title, optional intro, content.
export function HelpPage({ title, intro, children, wide = false }) {
  return (
    <div className={`mx-auto px-4 py-10 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
      <h1 className="text-3xl font-semibold text-[var(--bluecore-heading)]">{title}</h1>
      {intro && <p className="mt-2 text-[var(--bluecore-text-secondary)]">{intro}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

export function ArticleLink({ article }) {
  return (
    <Link
      to={`/articles/${article.slug}`}
      className="block rounded-lg border border-[var(--bluecore-border)] p-4 transition-colors hover:border-[var(--bluecore-border-strong)] hover:bg-slate-50"
    >
      <span className="font-medium text-[var(--bluecore-primary)]">{article.title}</span>
      {article.summary && <span className="mt-1 block text-sm text-[var(--bluecore-text-secondary)]">{article.summary}</span>}
    </Link>
  );
}

export function StillNeedHelp() {
  return (
    <aside className="mt-12 rounded-lg bg-[var(--bluecore-blue)] p-6 text-white">
      <h2 className="text-lg font-semibold">Still need help?</h2>
      <p className="mt-1 text-sm text-white/80">
        Email <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we'll open a
        ticket for you. Include your product and what you've tried.
      </p>
    </aside>
  );
}
