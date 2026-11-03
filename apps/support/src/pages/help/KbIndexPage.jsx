import { listPublishedArticles } from "../../lib/api.js";
import { groupByCategory } from "../../lib/kb.js";
import { usePageTitle } from "../../lib/usePageTitle.js";
import { useAsync } from "../../lib/useAsync.js";
import { ErrorBanner } from "../../components/ui.jsx";
import { ArticleLink, HelpPage, StillNeedHelp } from "./HelpLayout.jsx";

export default function KbIndexPage() {
  usePageTitle("Knowledge base");
  const { data, error, loading } = useAsync(() => listPublishedArticles("article"));
  return (
    <HelpPage title="Knowledge base" intro="How-to guides and troubleshooting for Bluecore products.">
      <ErrorBanner message={error} />
      {loading && <p className="text-sm text-[var(--bluecore-text-muted)]">Loading…</p>}
      {groupByCategory(data ?? []).map(([category, rows]) => (
        <section key={category} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-[var(--bluecore-heading)]">{category}</h2>
          <div className="grid gap-3">
            {rows.map((a) => (
              <ArticleLink key={a.id} article={a} />
            ))}
          </div>
        </section>
      ))}
      <StillNeedHelp />
    </HelpPage>
  );
}
