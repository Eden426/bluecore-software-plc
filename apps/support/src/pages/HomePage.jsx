// Public help center placeholder until Phase 4 (KB, FAQs, docs, updates).
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4">
      <h1 className="text-3xl font-semibold text-[var(--bluecore-heading)]">Bluecore Support</h1>
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
