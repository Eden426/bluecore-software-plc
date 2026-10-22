import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useAuth } from "../../auth/useAuth.js";
import { deleteArticle, describeError, getArticle, listProducts, saveArticle } from "../../lib/api.js";
import { KB_TYPES } from "../../lib/kb.js";
import { canManageClients, canManageContacts } from "../../lib/permissions.js";
import { slugify } from "../../lib/slugify.js";
import { useAsync } from "../../lib/useAsync.js";
import { Markdown } from "../../components/Markdown.jsx";
import { Button, Card, ErrorBanner, Field, Input, Select } from "../../components/ui.jsx";

const EMPTY = {
  type: "article",
  title: "",
  slug: "",
  summary: "",
  body: "",
  category: "",
  product_id: "",
  tags: [],
  status: "draft",
  visibility: "public",
  position: 0,
};

// /admin/kb/new and /admin/kb/:articleId
export default function KbEditorPage() {
  const { articleId } = useParams();
  const isNew = !articleId;
  const { data: article, error, loading } = useAsync(
    () => (isNew ? Promise.resolve(EMPTY) : getArticle(articleId)),
    articleId ?? "new",
  );

  if (loading) return <p className="text-sm text-[var(--bluecore-text-muted)]">Loading…</p>;
  if (error) return <ErrorBanner message={error} />;
  return <Editor key={articleId ?? "new"} initial={article} isNew={isNew} />;
}

function Editor({ initial, isNew }) {
  const { staff } = useAuth();
  const navigate = useNavigate();
  const editable = canManageContacts(staff);
  const { data: products } = useAsync(listProducts);
  const [form, setForm] = useState({
    ...initial,
    product_id: initial.product_id ?? "",
    tags: initial.tags.join(", "),
  });
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [tab, setTab] = useState("write");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  const slug = slugTouched ? form.slug : slugify(form.title);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  // Bespoke products' docs default to internal; the editor can still override.
  const product = (products ?? []).find((p) => p.id === form.product_id);

  async function save(overrides = {}) {
    setBusy(true);
    setError("");
    setSaved("");
    const values = {
      type: form.type,
      title: form.title.trim(),
      slug,
      summary: form.summary.trim(),
      body: form.body,
      category: form.category.trim(),
      product_id: form.product_id || null,
      tags: [...new Set(form.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))],
      status: form.status,
      visibility: form.visibility,
      position: Number(form.position) || 0,
      ...overrides,
    };
    if (isNew) values.author_id = staff.id;
    try {
      const result = await saveArticle(isNew ? null : initial.id, values);
      if (isNew) {
        navigate(`/admin/kb/${result.id}`, { replace: true });
        return;
      }
      setForm((f) => ({ ...f, status: result.status }));
      setSaved(result.status === "published" ? "Published." : "Saved.");
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete “${form.title}”? This can't be undone. Archive it instead to hide it.`)) return;
    try {
      await deleteArticle(initial.id);
      navigate("/admin/kb");
    } catch (err) {
      setError(describeError(err));
    }
  }

  const publicUrl = `/articles/${slug}`;

  return (
    <>
      <Link to="/admin/kb" className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--bluecore-text-secondary)] hover:underline">
        <ArrowLeft size={14} aria-hidden="true" /> All content
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[var(--bluecore-heading)]">
          {isNew ? "New entry" : form.title || "Untitled"}
        </h1>
        {!isNew && form.status === "published" && form.visibility === "public" && (
          <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-[var(--bluecore-primary)] hover:underline">
            View on help center <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="grid gap-6 lg:grid-cols-[1fr_18rem]"
      >
        <div className="space-y-4">
          <ErrorBanner message={error} />
          {saved && <p role="status" className="text-sm text-emerald-700">{saved}</p>}
          <Field label="Title">
            <Input required disabled={!editable} value={form.title} onChange={set("title")} />
          </Field>
          <Field label="Summary" hint="One sentence shown in listings and search results.">
            <Input disabled={!editable} value={form.summary} onChange={set("summary")} />
          </Field>
          <div className="rounded-lg border border-[var(--bluecore-border)] bg-white">
            <div role="tablist" aria-label="Body" className="flex border-b border-[var(--bluecore-border)] text-sm">
              {["write", "preview"].map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`px-4 py-2 capitalize ${tab === id ? "border-b-2 border-[var(--bluecore-primary)] font-medium" : "text-[var(--bluecore-text-secondary)]"}`}
                >
                  {id}
                </button>
              ))}
              <span className="ml-auto self-center px-4 text-xs text-[var(--bluecore-text-muted)]">Markdown</span>
            </div>
            {tab === "write" ? (
              <textarea
                aria-label="Body (Markdown)"
                disabled={!editable}
                rows={18}
                value={form.body}
                onChange={set("body")}
                className="block w-full resize-y rounded-b-lg border-0 p-4 font-mono text-sm focus:outline-none"
              />
            ) : (
              <div className="min-h-[20rem] p-6">
                {form.body.trim() ? <Markdown>{form.body}</Markdown> : <p className="text-sm text-[var(--bluecore-text-muted)]">Nothing to preview.</p>}
              </div>
            )}
          </div>
        </div>
        <aside className="space-y-4">
          <Card title="Publishing">
            <div className="space-y-3">
              <Field label="Status">
                <Select disabled={!editable} value={form.status} onChange={set("status")}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </Select>
              </Field>
              <Field label="Visibility" hint={form.visibility === "internal" ? "Only Bluecore staff can see this." : "Visible on the public help center once published."}>
                <Select disabled={!editable} value={form.visibility} onChange={set("visibility")}>
                  <option value="public">Public</option>
                  <option value="internal">Internal (staff only)</option>
                </Select>
              </Field>
              {editable && (
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
                  {form.status !== "published" && (
                    <Button variant="secondary" disabled={busy} onClick={() => save({ status: "published" })}>
                      Save &amp; publish
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
          <Card title="Details">
            <div className="space-y-3">
              <Field label="Type">
                <Select disabled={!editable} value={form.type} onChange={set("type")}>
                  {Object.entries(KB_TYPES).map(([value, { singular }]) => (
                    <option key={value} value={value}>{singular}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Slug" hint={`URL: /articles/${slug || "…"}`}>
                <Input
                  required
                  disabled={!editable}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm({ ...form, slug: e.target.value });
                  }}
                />
              </Field>
              <Field label="Category" hint="Groups entries, e.g. “Getting started”.">
                <Input disabled={!editable} value={form.category} onChange={set("category")} />
              </Field>
              <Field label="Product">
                <Select
                  disabled={!editable}
                  value={form.product_id}
                  onChange={(e) => {
                    const next = (products ?? []).find((p) => p.id === e.target.value);
                    setForm({ ...form, product_id: e.target.value, ...(next?.kind === "bespoke" ? { visibility: "internal" } : {}) });
                  }}
                >
                  <option value="">None</option>
                  {(products ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.kind === "bespoke" ? " (bespoke)" : ""}
                    </option>
                  ))}
                </Select>
              </Field>
              {product?.kind === "bespoke" && form.visibility === "public" && (
                <p className="text-xs text-amber-800">
                  This is a bespoke product. Publishing publicly will reveal its name and docs to anyone.
                </p>
              )}
              <Field label="Tags" hint="Comma-separated; improves search.">
                <Input disabled={!editable} value={form.tags} onChange={set("tags")} />
              </Field>
              <Field label="Order" hint="Lower numbers appear first within a category.">
                <Input type="number" disabled={!editable} value={form.position} onChange={set("position")} />
              </Field>
            </div>
          </Card>
          {!isNew && canManageClients(staff) && (
            <Button variant="danger" onClick={remove}>Delete entry</Button>
          )}
        </aside>
      </form>
    </>
  );
}
