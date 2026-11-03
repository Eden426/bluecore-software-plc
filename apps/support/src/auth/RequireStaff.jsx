import { Navigate, useLocation } from "react-router";
import { useAuth } from "./useAuth.js";
import { CenteredMessage } from "../components/CenteredMessage.jsx";

export function RequireStaff({ children }) {
  const { status, staff, signOut } = useAuth();
  const location = useLocation();

  if (status === "unconfigured") {
    return (
      <CenteredMessage title="Supabase isn't configured">
        Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> (see{" "}
        <code>apps/support/.env.example</code>).
      </CenteredMessage>
    );
  }
  if (status === "loading") return <CenteredMessage title="Loading…" />;
  if (status === "signed-out") {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  if (!staff?.active) {
    return (
      <CenteredMessage title="No staff access">
        Your account isn't an active Bluecore staff account. Ask an admin to enable it.
        <button type="button" onClick={signOut} className="mt-4 block underline">
          Sign out
        </button>
      </CenteredMessage>
    );
  }
  return children;
}
