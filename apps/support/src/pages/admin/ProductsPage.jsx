import { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../../auth/useAuth.js";
import { createProduct, describeError, listClients, listProducts, updateProduct } from "../../lib/api.js";
import { canManageClients } from "../../lib/permissions.js";
import { slugify } from "../../lib/slugify.js";
import { useAsync } from "../../lib/useAsync.js";
import { Badge, Button, Card, ErrorBanner, Field, Input, PageHeader, Select, Textarea } from "../../components/ui.jsx";

export default function ProductsPage() {
  const { staff } = useAuth();
  const isAdmin = canManageClients(staff);
  const { data: products, error, loading, reload } = useAsync(listProducts);
  const [creating, setCreating] = useState(false);
  const [rowError, setRowError] = useState("");

  async function toggleActive(product) {
    setRowError("");
    try {
      await updateProduct(product.id, { active: !product.active });
      await reload();
    } catch (err) {
      setRowError(describeError(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Products"
        description="Shared products offered to many clients, and bespoke software built for one."
        actions={
          isAdmin && !creating && (
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} aria-hidden="true" /> New product
            </Button>
          )
        }
      />
      {creating && (
        <NewProductForm
          onCancel={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            reload();
          }}
        />
      )}
      <ErrorBanner message={error || rowError} />
      <div className="overflow-x-auto rounded-lg border border-[var(--bluecore-border)] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--bluecore-border)] text-xs uppercase text-[var(--bluecore-text-muted)]">
            <tr>
              <th className="px-4 py-2 font-medium">Product</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Built for</th>
              <th className="px-4 py-2 font-medium">Deployments</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[var(--bluecore-text-muted)]">Loading…</td>
              </tr>
            )}
            {!loading && (products ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[var(--bluecore-text-muted)]">No products yet.</td>
              </tr>
            )}
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-b border-[var(--bluecore-border)] last:border-0">
                <td className="px-4 py-2">
                  <div className="font-medium">{p.name}</div>
                  {p.description && <div className="text-xs text-[var(--bluecore-text-muted)]">{p.description}</div>}
                </td>
                <td className="px-4 py-2">
                  <Badge tone={p.kind === "bespoke" ? "brown" : "neutral"}>{p.kind}</Badge>
                </td>
                <td className="px-4 py-2 text-[var(--bluecore-text-secondary)]">{p.owner?.name ?? "—"}</td>
                <td className="px-4 py-2">{p.client_products.length}</td>
                <td className="px-4 py-2">
                  {isAdmin ? (
                    <button type="button" onClick={() => toggleActive(p)} className="hover:opacity-80" aria-label={`Toggle ${p.name} status`}>
                      <Badge tone={p.active ? "green" : "neutral"}>{p.active ? "active" : "retired"}</Badge>
                    </button>
                  ) : (
                    <Badge tone={p.active ? "green" : "neutral"}>{p.active ? "active" : "retired"}</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function NewProductForm({ onCancel, onCreated }) {
  const { data: clients } = useAsync(listClients);
  const [form, setForm] = useState({ name: "", kind: "shared", owner_client_id: "", description: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await createProduct({
        name: form.name.trim(),
        slug: slugify(form.name),
        kind: form.kind,
        owner_client_id: form.kind === "bespoke" ? form.owner_client_id : null,
        description: form.description.trim(),
      });
      onCreated();
    } catch (err) {
      setError(describeError(err));
      setBusy(false);
    }
  }

  return (
    <div className="mb-6">
      <Card title="New product">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <ErrorBanner message={error} />
          </div>
          <Field label="Name" hint={form.name && `Slug: ${slugify(form.name)}`}>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Type">
            <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              <option value="shared">Shared</option>
              <option value="bespoke">Bespoke</option>
            </Select>
          </Field>
          {form.kind === "bespoke" && (
            <Field label="Built for">
              <Select required value={form.owner_client_id} onChange={(e) => setForm({ ...form, owner_client_id: e.target.value })}>
                <option value="">Choose a client…</option>
                {(clients ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
          )}
          <div className="sm:col-span-3">
            <Field label="Description">
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
          <div className="flex gap-2 sm:col-span-3">
            <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create product"}</Button>
            <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
