import { useState } from "react";
import { Link } from "react-router";
import { Plus } from "lucide-react";
import { useAuth } from "../../auth/useAuth.js";
import { createClient, describeError, listClients } from "../../lib/api.js";
import { canManageClients } from "../../lib/permissions.js";
import { slugify } from "../../lib/slugify.js";
import { useAsync } from "../../lib/useAsync.js";
import { SLA_TONE } from "../../lib/display.js";
import { Badge, Button, Card, ErrorBanner, Field, Input, PageHeader, Select } from "../../components/ui.jsx";

export default function ClientsPage() {
  const { staff } = useAuth();
  const { data: clients, error, loading, reload } = useAsync(listClients);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");

  const visible = (clients ?? []).filter((client) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      client.name.toLowerCase().includes(q) ||
      client.client_domains.some((d) => d.domain.includes(q))
    );
  });

  return (
    <>
      <PageHeader
        title="Clients"
        description="Organisations Bluecore supports, matched to inbound requests by email domain."
        actions={
          canManageClients(staff) && !creating && (
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} aria-hidden="true" /> New client
            </Button>
          )
        }
      />
      {creating && (
        <NewClientForm
          onCancel={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            reload();
          }}
        />
      )}
      <ErrorBanner message={error} />
      <div className="mb-3 max-w-xs">
        <Input
          type="search"
          placeholder="Search by name or domain"
          aria-label="Search clients"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto rounded-lg border border-[var(--bluecore-border)] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--bluecore-border)] text-xs uppercase text-[var(--bluecore-text-muted)]">
            <tr>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Domains</th>
              <th className="px-4 py-2 font-medium">SLA</th>
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
            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[var(--bluecore-text-muted)]">No clients found.</td>
              </tr>
            )}
            {visible.map((client) => (
              <tr key={client.id} className="border-b border-[var(--bluecore-border)] last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link to={`/admin/clients/${client.id}`} className="font-medium text-[var(--bluecore-primary)] hover:underline">
                    {client.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-[var(--bluecore-text-secondary)]">
                  {client.client_domains.map((d) => d.domain).join(", ") || "—"}
                </td>
                <td className="px-4 py-2">
                  <Badge tone={SLA_TONE[client.sla_tier]}>{client.sla_tier}</Badge>
                </td>
                <td className="px-4 py-2">{client.client_products.length}</td>
                <td className="px-4 py-2">
                  <Badge tone={client.active ? "green" : "neutral"}>{client.active ? "active" : "inactive"}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function NewClientForm({ onCancel, onCreated }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slaTier, setSlaTier] = useState("standard");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await createClient({ name: name.trim(), slug: slugTouched ? slug : slugify(name), sla_tier: slaTier });
      onCreated();
    } catch (err) {
      setError(describeError(err));
      setBusy(false);
    }
  }

  return (
    <div className="mb-6">
      <Card title="New client">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <ErrorBanner message={error} />
          </div>
          <Field label="Name">
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Slug" hint="Lowercase letters, numbers and dashes.">
            <Input
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={slugTouched ? slug : slugify(name)}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
          </Field>
          <Field label="SLA tier">
            <Select value={slaTier} onChange={(e) => setSlaTier(e.target.value)}>
              <option value="standard">Standard</option>
              <option value="priority">Priority</option>
              <option value="enterprise">Enterprise</option>
            </Select>
          </Field>
          <div className="flex gap-2 sm:col-span-3">
            <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create client"}</Button>
            <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
