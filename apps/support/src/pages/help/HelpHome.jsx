import { Link } from "react-router";
import { BookOpen, FileText, HelpCircle, Megaphone } from "lucide-react";
import { listPublishedArticles } from "../../lib/api.js";
import { formatDate } from "../../lib/kb.js";
import { usePageTitle } from "../../lib/usePageTitle.js";
import { useAsync } from "../../lib/useAsync.js";
import { ArticleLink, SearchBox, StillNeedHelp } from "./HelpLayout.jsx";

const SECTIONS = [
  { to: "/kb", title: "Knowledge base", text: "How-to guides and troubleshooting.", icon: BookOpen },
  { to: "/faq", title: "FAQs", text: "Quick answers to common questions.", icon: HelpCircle },
  { to: "/docs", title: "Product docs", text: "Reference for each Bluecore product.", icon: FileText },
  { to: "/updates", title: "Updates", text: "Release notes and announcements.", icon: Megaphone },
];

export default function HelpHome() {
  usePageTitle("Help center");
  const { data: articles } = useAsync(() => listPublishedArticles("article", { limit: 6 }));
  const { data: updates } = useAsync(() => listPublishedArticles("update", { limit: 3 }));

  return (
    <>
      <section className="bg-[var(--bluecore-blue)] px-4 py-14 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold sm:text-4xl">How can we help?</h1>
          <p className="mt-2 text-white/80">Search guides, FAQs and product documentation.</p>
          <div className="mt-6">
            <SearchBox large />
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map(({ to, title, text, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="rounded-lg border border-[var(--bluecore-border)] p-5 transition-colors hover:border-[var(--bluecore-border-strong)] hover:bg-slate-50"
            >
              <Icon size={22} aria-hidden="true" className="text-[var(--bluecore-accent-brown)]" />
              <h2 className="mt-3 font-semibold text-[var(--bluecore-heading)]">{title}</h2>
              <p className="mt-1 text-sm text-[var(--bluecore-text-secondary)]">{text}</p>
            </Link>
          ))}
        </div>
        <div className="mt-12 grid gap-10 lg:grid-cols-[2fr_1fr]">
          <section>
            <h2 className="text-lg font-semibold text-[var(--bluecore-heading)]">Popular articles</h2>
            <div className="mt-4 grid gap-3">
              {(articles ?? []).map((a) => (
                <ArticleLink key={a.id} article={a} />
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[var(--bluecore-heading)]">Latest updates</h2>
            <ul className="mt-4 space-y-4">
              {(updates ?? []).map((u) => (
                <li key={u.id}>
                  <Link to={`/articles/${u.slug}`} className="font-medium text-[var(--bluecore-primary)] hover:underline">
                    {u.title}
                  </Link>
                  <div className="text-xs text-[var(--bluecore-text-muted)]">{formatDate(u.published_at)}</div>
                </li>
              ))}
            </ul>
            <Link to="/updates" className="mt-4 inline-block text-sm text-[var(--bluecore-primary)] hover:underline">
              All updates →
            </Link>
          </section>
        </div>
        <StillNeedHelp />
      </div>
    </>
  );
}
