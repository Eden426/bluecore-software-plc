import { useState } from "react";
import { Link, useParams } from "react-router";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { getPublishedArticle, sendArticleFeedback } from "../../lib/api.js";
import { KB_TYPES, formatDate } from "../../lib/kb.js";
import { usePageTitle } from "../../lib/usePageTitle.js";
import { useAsync } from "../../lib/useAsync.js";
import { Markdown } from "../../components/Markdown.jsx";
import { HelpPage, StillNeedHelp } from "./HelpLayout.jsx";

export default function ArticlePage() {
  const { slug } = useParams();
  const { data: article, loading, error } = useAsync(() => getPublishedArticle(slug), slug);
  usePageTitle(article?.title ?? (loading ? "" : "Article not found"));

  if (loading) return <HelpPage title="Loading…" />;
  if (error || !article) {
    return (
      <HelpPage title="Article not found" intro="It may have been moved or unpublished.">
        <Link to="/" className="text-[var(--bluecore-primary)] hover:underline">← Help center home</Link>
      </HelpPage>
    );
  }

  const section = KB_TYPES[article.type];
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-[var(--bluecore-text-muted)]">
        <Link to="/" className="hover:underline">Help center</Link> /{" "}
        <Link to={section.path} className="hover:underline">{section.label}</Link>
        {article.category && <> / {article.category}</>}
      </nav>
      <h1 className="mt-3 text-3xl font-semibold text-[var(--bluecore-heading)]">{article.title}</h1>
      {article.summary && <p className="mt-2 text-lg text-[var(--bluecore-text-secondary)]">{article.summary}</p>}
      <p className="mt-2 text-xs text-[var(--bluecore-text-muted)]">
        {article.type === "update" ? "Published" : "Updated"} {formatDate(article.type === "update" ? article.published_at : article.updated_at)}
      </p>
      <div className="mt-8">
        <Markdown>{article.body}</Markdown>
      </div>
      {article.type !== "update" && <Feedback articleId={article.id} />}
      <StillNeedHelp />
    </article>
  );
}

function Feedback({ articleId }) {
  const [state, setState] = useState("idle");
  async function vote(helpful) {
    setState("sending");
    try {
      await sendArticleFeedback(articleId, helpful);
      setState("thanks");
    } catch {
      setState("error");
    }
  }
  if (state === "thanks") return <p className="mt-10 text-sm text-[var(--bluecore-text-secondary)]">Thanks for your feedback.</p>;
  return (
    <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-[var(--bluecore-border)] pt-6 text-sm">
      <span className="text-[var(--bluecore-text-secondary)]">Was this helpful?</span>
      {[
        { helpful: true, label: "Yes", icon: ThumbsUp },
        { helpful: false, label: "No", icon: ThumbsDown },
      ].map(({ helpful, label, icon: Icon }) => (
        <button
          key={label}
          type="button"
          disabled={state === "sending"}
          onClick={() => vote(helpful)}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--bluecore-border-strong)] px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
        >
          <Icon size={14} aria-hidden="true" /> {label}
        </button>
      ))}
      {state === "error" && <span className="text-red-700">Couldn't send — please try again.</span>}
    </div>
  );
}
