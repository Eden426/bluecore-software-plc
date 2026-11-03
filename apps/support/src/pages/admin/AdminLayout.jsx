import { NavLink, Outlet } from "react-router";
import { useEffect, useState } from "react";
import { BookOpen, Building2, Inbox, LogOut, MessagesSquare, Package, Users } from "lucide-react";
import { AgentPresence } from "../../auth/AgentPresence.jsx";
import { countWaitingChats } from "../../lib/api.js";
import { supabase } from "../../lib/supabase.js";
import { useAuth } from "../../auth/useAuth.js";
import { canManageStaff } from "../../lib/permissions.js";
import { Badge } from "../../components/ui.jsx";

const NAV = [
  { to: "/admin/tickets", label: "Tickets", icon: Inbox },
  { to: "/admin/chats", label: "Live chat", icon: MessagesSquare, badge: "waitingChats" },
  { to: "/admin/kb", label: "Help center", icon: BookOpen },
  { to: "/admin/clients", label: "Clients", icon: Building2 },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/staff", label: "Staff", icon: Users, adminOnly: true },
];

// Number of chats waiting for an agent, kept live for the nav badge.
function useWaitingChats() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!supabase) return undefined;
    const refresh = () => countWaitingChats().then(setCount, () => {});
    refresh();
    const channel = supabase
      .channel("admin-waiting-chats")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  return count;
}

export default function AdminLayout() {
  const { staff, signOut } = useAuth();
  const badges = { waitingChats: useWaitingChats() };
  const items = NAV.filter((item) => !item.adminOnly || canManageStaff(staff));

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <AgentPresence staff={staff} />
      <aside className="border-b border-[var(--bluecore-border)] bg-[var(--bluecore-blue)] text-white md:min-h-screen md:w-56 md:border-b-0">
        <div className="px-4 py-4 text-lg font-semibold">Bluecore Support</div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-0">
          {items.map(({ to, label, icon: Icon, badge }) => (
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
              {badge && badges[badge] > 0 && (
                <span className="ml-auto rounded-full bg-red-500 px-1.5 text-xs font-semibold" aria-label={`${badges[badge]} waiting`}>
                  {badges[badge]}
                </span>
              )}
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
