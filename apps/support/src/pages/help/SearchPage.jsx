import { Link, useSearchParams } from "react-router";
import { searchKb } from "../../lib/api.js";
import { KB_TYPES, splitHighlights } from "../../lib/kb.js";
import { usePageTitle } from "../../lib/usePageTitle.js";
import { useAsync } from "../../lib/useAsync.js";
import { ErrorBanner } from "../../components/ui.jsx";
import { HelpPage, SearchBox, StillNeedHelp } from "./HelpLayout.jsx";

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";
  usePageTitle(query ? `Search: ${query}` : "Search");
  const { data: results, error, loading } = useAsync(() => searchKb(query), query);

  return (
    <HelpPage title="Search">
      <SearchBox key={query} initial={query} />
      <ErrorBanner message={error} />
      <div className="mt-6" aria-live="polite">
        {loading && query && <p className="text-sm text-[var(--bluecore-text-muted)]">Searching…</p>}
        {!loading && query && results?.length === 0 && (
          <p className="text-[var(--bluecore-text-secondary)]">No results for “{query}”. Try different words.</p>
        )}
        {!loading && results?.length > 0 && (
          <>
            <p className="text-sm text-[var(--bluecore-text-muted)]">
              {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
            </p>
            <ol className="mt-4 space-y-5">
              {results.map((r) => (
                <li key={r.id}>
                  <div className="text-xs font-medium uppercase text-[var(--bluecore-text-muted)]">{KB_TYPES[r.type].singular}</div>
                  <Link to={`/articles/${r.slug}`} className="text-lg font-medium text-[var(--bluecore-primary)] hover:underline">
                    {r.title}
                  </Link>
                  <p className="mt-1 text-sm text-[var(--bluecore-text-secondary)]">
                    {splitHighlights(r.snippet).map((part, i) =>
                      part.match ? (
                        <mark key={i} className="rounded bg-amber-100 px-0.5 text-inherit">{part.text}</mark>
                      ) : (
                        <span key={i}>{part.text}</span>
                      ),
                    )}
                  </p>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
      <StillNeedHelp />
    </HelpPage>
  );
}
