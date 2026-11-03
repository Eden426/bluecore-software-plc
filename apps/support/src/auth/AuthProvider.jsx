import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { fetchStaffProfile } from "../lib/api.js";
import { AuthContext } from "./authContext.js";

// Context, provider and hook live in separate files so Vite Fast Refresh keeps
// working (same split as apps/web's ThemeProvider).
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [staff, setStaff] = useState(null);
  const [status, setStatus] = useState(supabase ? "loading" : "unconfigured");

  useEffect(() => {
    if (!supabase) return undefined;
    let cancelled = false;

    async function load(nextSession) {
      setSession(nextSession);
      if (!nextSession) {
        setStaff(null);
        setStatus("signed-out");
        return;
      }
      try {
        const profile = await fetchStaffProfile(nextSession.user.id);
        if (!cancelled) {
          setStaff(profile);
          setStatus("signed-in");
        }
      } catch {
        if (!cancelled) {
          setStaff(null);
          setStatus("signed-in");
        }
      }
    }

    // INITIAL_SESSION fires on subscribe, so no separate getSession() call.
    // Token refreshes don't change who's signed in, so skip the profile refetch.
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "TOKEN_REFRESHED") {
        setSession(nextSession);
        return;
      }
      // Defer: calling Supabase inside this callback can deadlock the client.
      setTimeout(() => load(nextSession), 0);
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ session, staff, status, signIn, signOut }),
    [session, staff, status, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
