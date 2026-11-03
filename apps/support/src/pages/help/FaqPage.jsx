import { listFaqs } from "../../lib/api.js";
import { groupByCategory } from "../../lib/kb.js";
import { usePageTitle } from "../../lib/usePageTitle.js";
import { useAsync } from "../../lib/useAsync.js";
import { Markdown } from "../../components/Markdown.jsx";
import { ErrorBanner } from "../../components/ui.jsx";
import { HelpPage, StillNeedHelp } from "./HelpLayout.jsx";

export default function FaqPage() {
  usePageTitle("FAQs");
  const { data, error, loading } = useAsync(listFaqs);
  return (
    <HelpPage title="Frequently asked questions">
      <ErrorBanner message={error} />
      {loading && <p className="text-sm text-[var(--bluecore-text-muted)]">Loading…</p>}
      {groupByCategory(data ?? []).map(([category, rows]) => (
        <section key={category} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-[var(--bluecore-heading)]">{category}</h2>
          <div className="divide-y divide-[var(--bluecore-border)] rounded-lg border border-[var(--bluecore-border)]">
            {rows.map((faq) => (
              <details key={faq.id} id={faq.slug} className="group p-4">
                <summary className="cursor-pointer list-none font-medium text-[var(--bluecore-heading)] marker:hidden">
                  <span className="mr-2 inline-block transition-transform group-open:rotate-90" aria-hidden="true">›</span>
                  {faq.title}
                </summary>
                <div className="mt-3 pl-5">
                  <Markdown>{faq.body}</Markdown>
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
      <StillNeedHelp />
    </HelpPage>
  );
}
