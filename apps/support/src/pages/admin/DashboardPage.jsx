import { useState } from "react";
import { Link } from "react-router";
import { describeError, getDashboard } from "../../lib/api.js";
import { PRIORITY_TONE, STATUS_LABEL } from "../../lib/tickets.js";
import { useAsync } from "../../lib/useAsync.js";
import { Badge, Card, ErrorBanner, PageHeader, Select } from "../../components/ui.jsx";

const RANGES = [7, 30, 90];
const PRIORITIES = ["urgent", "high", "normal", "low"];
const CHANNEL_LABEL = { email: "Email", web: "Web", chat: "Live chat", phone: "Phone", booking: "Call booking" };

function formatMinutes(minutes) {
  if (minutes == null) return "–";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 6) / 10}h`;
  return `${Math.round(minutes / 144) / 10}d`;
}

// /admin/dashboard: the queue right now, plus volume and response times over
// the chosen period.
export default function DashboardPage() {
  const [days, setDays] = useState(30);
  const { data, error, loading } = useAsync(() => getDashboard(days), days);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="How the support queue is doing."
        actions={
          <div className="w-40">
            <Select aria-label="Period" value={days} onChange={(e) => setDays(Number(e.target.value))}>
              {RANGES.map((d) => (
                <option key={d} value={d}>Last {d} days</option>
              ))}
            </Select>
          </div>
        }
      />
      {error && <ErrorBanner message={describeError(error)} />}
      {loading && !data && <p className="text-sm text-[var(--bluecore-text-muted)]">Loading…</p>}
      {data && <Dashboard data={data} />}
    </>
  );
}

function Dashboard({ data }) {
  return (
    <div className="space-y-6">
      <section aria-label="Queue now" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Open tickets" value={data.open} to="/admin/tickets?view=open" />
        <Stat label="Unassigned" value={data.unassigned} to="/admin/tickets?view=unassigned" warn={data.unassigned > 0} />
        <Stat label="First reply overdue" value={data.first_response_overdue} warn={data.first_response_overdue > 0} />
        <Stat label="Resolution overdue" value={data.resolution_overdue} warn={data.resolution_overdue > 0} />
      </section>

      <section aria-label={`Last ${data.days} days`} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Created" value={data.created} />
        <Stat label="Solved" value={data.solved} />
        <Stat label="Median first reply" value={formatMinutes(data.median_first_response_minutes)} />
        <Stat
          label="First reply on time"
          value={data.first_response_met_pct == null ? "–" : `${data.first_response_met_pct}%`}
        />
      </section>

      <Card title={`Tickets per day (last ${data.days} days)`}>
        <DailyChart daily={data.daily} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Open by priority">
          <Breakdown
            rows={PRIORITIES.map((p) => [p, data.open_by_priority[p] ?? 0])}
            label={(p) => <Badge tone={PRIORITY_TONE[p]}>{p}</Badge>}
          />
        </Card>
        <Card title="Open by status">
          <Breakdown
            rows={Object.keys(STATUS_LABEL)
              .filter((s) => s in data.open_by_status)
              .map((s) => [s, data.open_by_status[s]])}
            label={(s) => STATUS_LABEL[s]}
          />
        </Card>
        <Card title="New tickets by channel">
          <Breakdown
            rows={Object.entries(data.by_channel).sort((a, b) => b[1] - a[1])}
            label={(c) => CHANNEL_LABEL[c] ?? c}
          />
        </Card>
        <Card title="Busiest clients">
          {data.top_clients.length === 0 ? (
            <Empty />
          ) : (
            <Breakdown
              rows={data.top_clients.map((c) => [c.id, c.tickets])}
              label={(id) => {
                const c = data.top_clients.find((x) => x.id === id);
                return <Link to={`/admin/clients/${id}`} className="hover:underline">{c.name}</Link>;
              }}
            />
          )}
        </Card>
        <Card title="Agents">
          {data.agents.length === 0 ? (
            <Empty />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--bluecore-text-muted)]">
                  <th className="pb-2 font-medium">Agent</th>
                  <th className="pb-2 text-right font-medium">Open</th>
                  <th className="pb-2 text-right font-medium">Solved</th>
                </tr>
              </thead>
              <tbody>
                {data.agents.map((a) => (
                  <tr key={a.id} className="border-t border-[var(--bluecore-border)]">
                    <td className="py-1.5 break-all">{a.name}</td>
                    <td className="py-1.5 text-right tabular-nums">{a.open}</td>
                    <td className="py-1.5 text-right tabular-nums">{a.solved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card title="AI triage">
          <AiStats stats={data.ai_triage} />
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, to, warn = false }) {
  const body = (
    <>
      <div className="text-xs text-[var(--bluecore-text-muted)]">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${warn ? "text-red-700" : "text-[var(--bluecore-heading)]"}`}>
        {value}
      </div>
    </>
  );
  const className = "block rounded-lg border border-[var(--bluecore-border)] bg-white p-4";
  return to ? (
    <Link to={to} className={`${className} hover:border-[var(--bluecore-primary)]`}>{body}</Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function Breakdown({ rows, label }) {
  const max = Math.max(1, ...rows.map(([, n]) => n));
  if (rows.length === 0) return <Empty />;
  return (
    <ul className="space-y-2">
      {rows.map(([key, n]) => (
        <li key={key} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-2 text-sm">
          <span className="truncate">{label(key)}</span>
          <span className="h-2 rounded bg-[var(--bluecore-border)]">
            <span className="block h-2 rounded bg-[var(--bluecore-primary)]" style={{ width: `${(n / max) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums">{n}</span>
        </li>
      ))}
    </ul>
  );
}

// Created (filled) and solved (outlined) side by side for each day.
function DailyChart({ daily }) {
  const max = Math.max(1, ...daily.flatMap((d) => [d.created, d.solved]));
  const label = (day) => new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return (
    <figure>
      <div className="flex h-36 items-end gap-px" role="img" aria-label="Tickets created and solved per day">
        {daily.map((d) => (
          <div key={d.day} className="flex h-full flex-1 items-end gap-px" title={`${label(d.day)}: ${d.created} created, ${d.solved} solved`}>
            <span className="flex-1 rounded-t bg-[var(--bluecore-primary)]" style={{ height: `${(d.created / max) * 100}%` }} />
            <span className="flex-1 rounded-t border border-b-0 border-[var(--bluecore-primary)]" style={{ height: `${(d.solved / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <figcaption className="mt-2 flex justify-between text-xs text-[var(--bluecore-text-muted)]">
        <span>{label(daily[0].day)}</span>
        <span className="flex gap-3">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-[var(--bluecore-primary)]" /> Created</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-sm border border-[var(--bluecore-primary)]" /> Solved</span>
        </span>
        <span>{label(daily[daily.length - 1].day)}</span>
      </figcaption>
    </figure>
  );
}

function AiStats({ stats }) {
  const decided = stats.applied + stats.dismissed;
  return (
    <dl className="grid grid-cols-3 gap-2 text-center text-sm">
      <div>
        <dt className="text-xs text-[var(--bluecore-text-muted)]">Suggested</dt>
        <dd className="text-xl font-semibold tabular-nums">{stats.suggested}</dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--bluecore-text-muted)]">Applied</dt>
        <dd className="text-xl font-semibold tabular-nums">{stats.applied}</dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--bluecore-text-muted)]">Acceptance</dt>
        <dd className="text-xl font-semibold tabular-nums">{decided ? `${Math.round((100 * stats.applied) / decided)}%` : "–"}</dd>
      </div>
    </dl>
  );
}

const Empty = () => <p className="text-sm text-[var(--bluecore-text-muted)]">Nothing yet.</p>;
