import { NavLink, Outlet } from "react-router";
import { BookOpen, Building2, Inbox, LogOut, Package, Users } from "lucide-react";
import { useAuth } from "../../auth/useAuth.js";
import { canManageStaff } from "../../lib/permissions.js";
import { Badge } from "../../components/ui.jsx";

const NAV = [
  { to: "/admin/tickets", label: "Tickets", icon: Inbox },
  { to: "/admin/kb", label: "Help center", icon: BookOpen },
  { to: "/admin/clients", label: "Clients", icon: Building2 },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/staff", label: "Staff", icon: Users, adminOnly: true },
];

export default function AdminLayout() {
  const { staff, signOut } = useAuth();
  const items = NAV.filter((item) => !item.adminOnly || canManageStaff(staff));

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="border-b border-[var(--bluecore-border)] bg-[var(--bluecore-blue)] text-white md:min-h-screen md:w-56 md:border-b-0">
        <div className="px-4 py-4 text-lg font-semibold">Bluecore Support</div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-0">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap ${
                  isActive ? "bg-white/15 font-medium" : "text-white/80 hover:bg-white/10"
                }`
              }
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-end gap-3 border-b border-[var(--bluecore-border)] bg-white px-4 py-2 text-sm">
          <span className="text-[var(--bluecore-text-secondary)]">{staff.full_name || staff.email}</span>
          <Badge tone="blue">{staff.role}</Badge>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-1 text-[var(--bluecore-text-secondary)] hover:text-[var(--bluecore-text)]"
          >
            <LogOut size={14} aria-hidden="true" /> Sign out
          </button>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
