import { useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { AGENTS_CHANNEL } from "../lib/chat.js";
import { hasRole } from "../lib/permissions.js";

// While an agent has the console open they count as "online" for the help
// center chat widget (Realtime presence keyed by staff id).
export function AgentPresence({ staff }) {
  const canChat = hasRole(staff, "agent");
  useEffect(() => {
    if (!supabase || !canChat) return undefined;
    const channel = supabase.channel(AGENTS_CHANNEL, { config: { presence: { key: staff.id } } });
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") channel.track({ online_at: new Date().toISOString() });
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [canChat, staff.id]);
  return null;
}
