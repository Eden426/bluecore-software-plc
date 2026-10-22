import { useState } from "react";
import { useNavigate } from "react-router";
import { createStaffTicket, describeError } from "../../lib/api.js";
import { Button, Card, ErrorBanner, Field, Input, PageHeader, Select, Textarea } from "../../components/ui.jsx";

// For requests that arrive by phone, in person or elsewhere: the agent records
// the customer's own description, and the client is matched from their email.
export default function NewTicketPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    subject: "",
    requester_email: "",
    requester_name: "",
    description: "",
    channel: "phone",
    priority: "normal",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const ticket = await createStaffTicket(form);
      navigate(`/admin/tickets/${ticket.id}`);
    } catch (err) {
      setError(describeError(err));
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Log a ticket" description="For requests that came in by phone, in person or another channel." />
      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><ErrorBanner message={error} /></div>
          <div className="sm:col-span-2">
            <Field label="Subject"><Input required value={form.subject} onChange={set("subject")} /></Field>
          </div>
          <Field label="Requester email" hint="Used to match the client by domain.">
            <Input type="email" required value={form.requester_email} onChange={set("requester_email")} />
          </Field>
          <Field label="Requester name"><Input value={form.requester_name} onChange={set("requester_name")} /></Field>
          <Field label="Channel">
            <Select value={form.channel} onChange={set("channel")}>
              <option value="phone">Phone</option>
              <option value="web">Web</option>
              <option value="chat">Chat</option>
              <option value="email">Email</option>
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={set("priority")}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="What the customer reported"><Textarea rows={5} required value={form.description} onChange={set("description")} /></Field>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create ticket"}</Button>
            <Button variant="secondary" onClick={() => navigate("/admin/tickets")}>Cancel</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
