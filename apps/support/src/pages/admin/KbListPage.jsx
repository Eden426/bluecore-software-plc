import { useState } from "react";
import { Link } from "react-router";
import { Plus } from "lucide-react";
import { useAuth } from "../../auth/useAuth.js";
import { listAllArticles, listFeedbackTotals } from "../../lib/api.js";
import { KB_TYPES } from "../../lib/kb.js";
import { canManageContacts } from "../../lib/permissions.js";
import { formatDateTime } from "../../lib/tickets.js";
import { useAsync } from "../../lib/useAsync.js";
import { Badge, ErrorBanner, Input, PageHeader, Select } from "../../components/ui.jsx";

const STATUS_TONE = { draft: "neutral", published: "green", archived: "neutral" };

export default function KbListPage() {
  const { staff } = useAuth();
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const filters = { type, status, search };
  const { data: articles, error, loading } = useAsync(() => listAllArticles(filters), JSON.stringify(filters));
  const { data: totals } = useAsync(listFeedbackTotals);
  const votes = Object.fromEntries((totals ?? []).map((t) => [t.article_id, t]));

  return (
    <>
      <PageHeader
        title="Help center content"
        description="Articles, FAQs, product docs and updates shown on the public help center."
        actions={
          canManageContacts(staff) && (
            <Link
              to="/admin/kb/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--bluecore-primary)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--bluecore-primary-hover)]"
            >
              <Plus size={16} aria-hidden="true" /> New entry
            </Link>
          )
        }
      />
      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_11rem_10rem]">
        <Input type="search" aria-label="Search content" placeholder="Search by title or slug" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select aria-label="Type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {Object.entries(KB_TYPES).map(([value, { singular }]) => (
            <option key={value} value={value}>{singular}</option>
          ))}
        </Select>
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
      </div>
      <ErrorBanner message={error} />
      <div className="overflow-x-auto rounded-lg border border-[var(--bluecore-border)] bg-white">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-[var(--bluecore-border)] text-xs uppercase text-[var(--bluecore-text-muted)]">
            <tr>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Helpful</th>
              <th className="px-4 py-2 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-[var(--bluecore-text-muted)]">Loading…</td></tr>
            )}
            {!loading && (articles ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-[var(--bluecore-text-muted)]">Nothing here yet.</td></tr>
            )}
            {(articles ?? []).map((a) => {
              const v = votes[a.id];
              return (
                <tr key={a.id} className="border-b border-[var(--bluecore-border)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link to={`/admin/kb/${a.id}`} className="font-medium text-[var(--bluecore-primary)] hover:underline">{a.title}</Link>
                    <div className="text-xs text-[var(--bluecore-text-muted)]">
                      /{a.slug}
                      {a.product?.name && ` · ${a.product.name}`}
                      {a.category && ` · ${a.category}`}
                    </div>
                  </td>
                  <td className="px-4 py-2">{KB_TYPES[a.type].singular}</td>
                  <td className="px-4 py-2">
                    <span className="flex flex-wrap gap-1">
                      <Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge>
                      {a.visibility === "internal" && <Badge tone="brown">internal</Badge>}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-[var(--bluecore-text-secondary)]">{v ? `👍 ${v.helpful} · 👎 ${v.not_helpful}` : "—"}</td>
                  <td className="px-4 py-2 text-[var(--bluecore-text-secondary)]">{formatDateTime(a.updated_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
