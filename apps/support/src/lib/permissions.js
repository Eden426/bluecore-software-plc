// Mirrors the RLS policies in supabase/migrations: the database is the real
// gate, this only decides which controls to show.
const RANK = { viewer: 0, agent: 1, admin: 2 };

export function hasRole(staff, minRole) {
  if (!staff?.active) return false;
  return RANK[staff.role] >= RANK[minRole];
}

export const canManageClients = (staff) => hasRole(staff, "admin");
export const canManageContacts = (staff) => hasRole(staff, "agent");
export const canManageStaff = (staff) => hasRole(staff, "admin");
