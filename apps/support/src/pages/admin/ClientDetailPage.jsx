import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useAuth } from "../../auth/useAuth.js";
import {
  addClientDomain,
  addContact,
  addDeployment,
  describeError,
  getClient,
  listProducts,
  removeClientDomain,
  removeContact,
  removeDeployment,
  updateClient,
} from "../../lib/api.js";
import { canManageClients, canManageContacts } from "../../lib/permissions.js";
import { useAsync } from "../../lib/useAsync.js";
import { SLA_TONE } from "../../lib/display.js";
import {
  Badge,
  Button,
  Card,
  ErrorBanner,
  Field,
  Input,
  PageHeader,
 
  Select,
  Textarea,
} from "../../components/ui.jsx";

export default function ClientDetailPage() {
  const { clientId } = useParams();
  const { staff } = useAuth();
  const { data: client, error, loading, reload } = useAsync(() => getClient(clientId), clientId);

  if (loading) return <p className="text-sm text-[var(--bluecore-text-muted)]">Loading…</p>;
  if (error) return <ErrorBanner message={error} />;

  const isAdmin = canManageClients(staff);

  return (
    <>
      <Link
        to="/admin/clients"
        className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--bluecore-text-secondary)] hover:underline"
      >
        <ArrowLeft size={14} aria-hidden="true" /> All clients
      </Link>
      <PageHeader
        title={client.name}
        actions={
          <div className="flex gap-2">
            <Badge tone={SLA_TONE[client.sla_tier]}>{client.sla_tier} SLA</Badge>
            <Badge tone={client.active ? "green" : "neutral"}>{client.active ? "active" : "inactive"}</Badge>
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <DetailsCard key={client.id} client={client} editable={isAdmin} onSaved={reload} />
        <DomainsCard client={client} editable={isAdmin} onChanged={reload} />
        <ContactsCard client={client} editable={canManageContacts(staff)} onChanged={reload} />
        <DeploymentsCard client={client} editable={isAdmin} onChanged={reload} />
      </div>
    </>
  );
}

// Runs a mutation, shows its error inline, and reloads on success.
function useMutation(onDone) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function run(fn) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await onDone();
      return true;
    } catch (err) {
      setError(describeError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { error, busy, run };
}

function DetailsCard({ client, editable, onSaved }) {
  const [form, setForm] = useState({
    name: client.name,
    sla_tier: client.sla_tier,
    active: client.active,
    notes: client.notes,
  });
  const { error, busy, run } = useMutation(onSaved);
  const dirty =
    form.name !== client.name ||
    form.sla_tier !== client.sla_tier ||
    form.active !== client.active ||
    form.notes !== client.notes;

  return (
    <Card title="Details">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => updateClient(client.id, { ...form, name: form.name.trim() }));
        }}
      >
        <ErrorBanner message={error} />
        <Field label="Name">
          <Input required disabled={!editable} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="SLA tier">
            <Select disabled={!editable} value={form.sla_tier} onChange={(e) => setForm({ ...form, sla_tier: e.target.value })}>
              <option value="standard">Standard</option>
              <option value="priority">Priority</option>
              <option value="enterprise">Enterprise</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select
              disabled={!editable}
              value={form.active ? "active" : "inactive"}
              onChange={(e) => setForm({ ...form, active: e.target.value === "active" })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        </div>
        <Field label="Internal notes">
          <Textarea disabled={!editable} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
        <p className="text-xs text-[var(--bluecore-text-muted)]">Slug: {client.slug}</p>
        {editable && (
          <Button type="submit" disabled={!dirty || busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        )}
      </form>
    </Card>
  );
}

function DomainsCard({ client, editable, onChanged }) {
  const [domain, setDomain] = useState("");
  const { error, busy, run } = useMutation(onChanged);

  return (
    <Card title="Email domains">
      <p className="mb-3 text-xs text-[var(--bluecore-text-muted)]">
        Emails and chats from these domains are linked to {client.name} automatically.
      </p>
      <ErrorBanner message={error} />
      <ul className="my-2 divide-y divide-[var(--bluecore-border)]">
        {client.client_domains.length === 0 && (
          <li className="py-2 text-sm text-[var(--bluecore-text-muted)]">No domains yet.</li>
        )}
        {client.client_domains.map((d) => (
          <li key={d.id} className="flex items-center justify-between py-2 text-sm">
            <span>{d.domain}</span>
            {editable && (
              <Button variant="danger" aria-label={`Remove ${d.domain}`} disabled={busy} onClick={() => run(() => removeClientDomain(d.id))}>
                <Trash2 size={14} aria-hidden="true" />
              </Button>
            )}
          </li>
        ))}
      </ul>
      {editable && (
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run(() => addClientDomain(client.id, domain))) setDomain("");
          }}
        >
          <Input
            required
            placeholder="example.com"
            aria-label="New domain"
            pattern="[A-Za-z0-9]([A-Za-z0-9\-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9\-]*[A-Za-z0-9])?)+"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <Button type="submit" disabled={busy}>Add</Button>
        </form>
      )}
    </Card>
  );
}

const EMPTY_CONTACT = { full_name: "", email: "", phone: "", job_title: "", is_primary: false };

function ContactsCard({ client, editable, onChanged }) {
  const [form, setForm] = useState(EMPTY_CONTACT);
  const [adding, setAdding] = useState(false);
  const { error, busy, run } = useMutation(onChanged);

  return (
    <Card
      title="Contacts"
      actions={editable && !adding && <Button variant="secondary" onClick={() => setAdding(true)}>Add contact</Button>}
    >
      <ErrorBanner message={error} />
      <ul className="divide-y divide-[var(--bluecore-border)]">
        {client.client_contacts.length === 0 && (
          <li className="py-2 text-sm text-[var(--bluecore-text-muted)]">No contacts yet.</li>
        )}
        {client.client_contacts.map((c) => (
          <li key={c.id} className="flex items-start justify-between gap-2 py-2 text-sm">
            <div>
              <div className="font-medium">
                {c.full_name} {c.is_primary && <Badge tone="blue">primary</Badge>}
              </div>
              <div className="text-[var(--bluecore-text-secondary)]">
                {[c.job_title, c.email, c.phone].filter(Boolean).join(" · ")}
              </div>
            </div>
            {editable && (
              <Button variant="danger" aria-label={`Remove ${c.full_name}`} disabled={busy} onClick={() => run(() => removeContact(c.id))}>
                <Trash2 size={14} aria-hidden="true" />
              </Button>
            )}
          </li>
        ))}
      </ul>
      {adding && (
        <form
          className="mt-3 grid gap-3 border-t border-[var(--bluecore-border)] pt-3 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run(() => addContact(client.id, { ...form, email: form.email.trim().toLowerCase() }))) {
              setForm(EMPTY_CONTACT);
              setAdding(false);
            }
          }}
        >
          <Field label="Full name">
            <Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Job title">
            <Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
          </Field>
          <Field label="Phone">
            <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={form.is_primary} onChange={(e) => setForm({ ...form, is_primary: e.target.checked })} />
            Primary contact
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={busy}>Save contact</Button>
            <Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </form>
      )}
    </Card>
  );
}

const EMPTY_DEPLOYMENT = { product_id: "", environment: "production", url: "", version: "" };

function DeploymentsCard({ client, editable, onChanged }) {
  const [form, setForm] = useState(EMPTY_DEPLOYMENT);
  const [adding, setAdding] = useState(false);
  const { error, busy, run } = useMutation(onChanged);
  const { data: products } = useAsync(() => (editable ? listProducts() : Promise.resolve([])), editable);

  // Shared products, plus bespoke ones built for this client.
  const deployable = (products ?? []).filter(
    (p) => p.active && (p.kind === "shared" || p.owner_client_id === client.id),
  );

  return (
    <Card
      title="Products & deployments"
      actions={editable && !adding && <Button variant="secondary" onClick={() => setAdding(true)}>Add deployment</Button>}
    >
      <ErrorBanner message={error} />
      <ul className="divide-y divide-[var(--bluecore-border)]">
        {client.client_products.length === 0 && (
          <li className="py-2 text-sm text-[var(--bluecore-text-muted)]">No deployments yet.</li>
        )}
        {client.client_products.map((d) => (
          <li key={d.id} className="flex items-start justify-between gap-2 py-2 text-sm">
            <div>
              <div className="font-medium">
                {d.products.name} <Badge tone={d.products.kind === "bespoke" ? "brown" : "neutral"}>{d.products.kind}</Badge>
              </div>
              <div className="text-[var(--bluecore-text-secondary)]">
                {[d.environment, d.version && `v${d.version}`, d.url].filter(Boolean).join(" · ")}
              </div>
            </div>
            {editable && (
              <Button
                variant="danger"
                aria-label={`Remove ${d.products.name} ${d.environment}`}
                disabled={busy}
                onClick={() => run(() => removeDeployment(d.id))}
              >
                <Trash2 size={14} aria-hidden="true" />
              </Button>
            )}
          </li>
        ))}
      </ul>
      {adding && (
        <form
          className="mt-3 grid gap-3 border-t border-[var(--bluecore-border)] pt-3 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run(() => addDeployment(client.id, form))) {
              setForm(EMPTY_DEPLOYMENT);
              setAdding(false);
            }
          }}
        >
          <Field label="Product">
            <Select required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
              <option value="">Choose…</option>
              {deployable.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.kind === "bespoke" ? " (bespoke)" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Environment">
            <Input required value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })} />
          </Field>
          <Field label="URL">
            <Input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </Field>
          <Field label="Version">
            <Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
          </Field>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={busy}>Save deployment</Button>
            <Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </form>
      )}
    </Card>
  );
}
