// Placeholder until the help center and admin console land (see the support
// app plan in the repo root CLAUDE.md).
export default function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4">
      <h1 className="text-3xl font-semibold text-[var(--bluecore-heading)]">
        Bluecore Support
      </h1>
      <p className="mt-3 text-[var(--bluecore-text-secondary)]">
        Help center, ticketing and live chat are on the way. For now, contact{" "}
        <a className="underline" href="mailto:team@blue-core.tech">
          team@blue-core.tech
        </a>
        .
      </p>
    </main>
  );
}
