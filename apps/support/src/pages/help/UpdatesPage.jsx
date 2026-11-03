import { Link } from "react-router";
import { listPublishedArticles } from "../../lib/api.js";
import { formatDate } from "../../lib/kb.js";
import { usePageTitle } from "../../lib/usePageTitle.js";
import { useAsync } from "../../lib/useAsync.js";
import { ErrorBanner } from "../../components/ui.jsx";
import { HelpPage } from "./HelpLayout.jsx";

export default function UpdatesPage() {
  usePageTitle("Updates");
  const { data, error, loading } = useAsync(() => listPublishedArticles("update"));
  return (
    <HelpPage title="Product updates" intro="Release notes and announcements, newest first.">
      <ErrorBanner message={error} />
      {loading && <p className="text-sm text-[var(--bluecore-text-muted)]">Loading…</p>}
      <ol className="relative space-y-8 border-l border-[var(--bluecore-border)] pl-6">
        {(data ?? []).map((u) => (
          <li key={u.id}>
            <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-[var(--bluecore-accent-brown)]" aria-hidden="true" />
            <time className="text-xs text-[var(--bluecore-text-muted)]" dateTime={u.published_at}>{formatDate(u.published_at)}</time>
            <h2 className="mt-1 text-lg font-semibold">
              <Link to={`/articles/${u.slug}`} className="text-[var(--bluecore-heading)] hover:underline">{u.title}</Link>
            </h2>
            {u.summary && <p className="mt-1 text-[var(--bluecore-text-secondary)]">{u.summary}</p>}
          </li>
        ))}
      </ol>
    </HelpPage>
  );
}
