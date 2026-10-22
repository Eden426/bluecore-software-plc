export function CenteredMessage({ title, children }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-[var(--bluecore-heading)]">{title}</h1>
        {children && <div className="mt-2 text-sm text-[var(--bluecore-text-secondary)]">{children}</div>}
      </div>
    </main>
  );
}
