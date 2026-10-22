import { useState } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../auth/useAuth.js";
import { describeError, listStaff, updateStaff } from "../../lib/api.js";
import { canManageStaff } from "../../lib/permissions.js";
import { useAsync } from "../../lib/useAsync.js";
import { Badge, ErrorBanner, PageHeader, Select } from "../../components/ui.jsx";

export default function StaffPage() {
  const { staff: me } = useAuth();
  const { data: staff, error, reload } = useAsync(listStaff);
  const [saveError, setSaveError] = useState("");

  if (!canManageStaff(me)) return <Navigate to="/admin/clients" replace />;

  async function save(id, changes) {
    setSaveError("");
    try {
      await updateStaff(id, changes);
      await reload();
    } catch (err) {
      setSaveError(describeError(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Staff"
        description="New staff accounts are created by an admin in the Supabase dashboard (Authentication → Add user). They start as viewers."
      />
      <ErrorBanner message={error || saveError} />
      <div className="overflow-x-auto rounded-lg border border-[var(--bluecore-border)] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--bluecore-border)] text-xs uppercase text-[var(--bluecore-text-muted)]">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Access</th>
            </tr>
          </thead>
          <tbody>
            {(staff ?? []).map((s) => (
              <tr key={s.id} className="border-b border-[var(--bluecore-border)] last:border-0">
                <td className="px-4 py-2 font-medium">
                  {s.full_name || "—"} {s.id === me.id && <Badge>you</Badge>}
                </td>
                <td className="px-4 py-2 text-[var(--bluecore-text-secondary)]">{s.email}</td>
                <td className="px-4 py-2">
                  <Select aria-label={`Role for ${s.email}`} value={s.role} onChange={(e) => save(s.id, { role: e.target.value })}>
                    <option value="viewer">Viewer</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </Select>
                </td>
                <td className="px-4 py-2">
                  <Select
                    aria-label={`Access for ${s.email}`}
                    value={s.active ? "active" : "disabled"}
                    onChange={(e) => save(s.id, { active: e.target.value === "active" })}
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
