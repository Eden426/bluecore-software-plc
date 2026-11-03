import { useState } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../auth/useAuth.js";
import { Button, ErrorBanner, Field, Input } from "../components/ui.jsx";

export default function LoginPage() {
  const { status, signIn } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (status === "signed-in") return <Navigate to={location.state?.from || "/admin"} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signIn(email, password);
    } catch {
      setError("Email or password is incorrect.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-[var(--bluecore-border)] bg-white p-6 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-semibold text-[var(--bluecore-heading)]">Bluecore Support</h1>
          <p className="text-sm text-[var(--bluecore-text-secondary)]">Staff sign in</p>
        </div>
        <ErrorBanner message={error} />
        <Field label="Email">
          <Input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" disabled={busy || status === "unconfigured"} className="w-full">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        {status === "unconfigured" && (
          <p className="text-xs text-red-700">Supabase isn't configured for this build.</p>
        )}
      </form>
    </main>
  );
}
