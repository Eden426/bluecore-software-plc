// Small set of styled primitives shared by the admin screens.
const BUTTON_STYLES = {
  primary: "bg-[var(--bluecore-primary)] text-white hover:bg-[var(--bluecore-primary-hover)]",
  secondary:
    "border border-[var(--bluecore-border-strong)] bg-white text-[var(--bluecore-text)] hover:bg-slate-50",
  danger: "text-red-700 hover:bg-red-50",
};

export function Button({ variant = "primary", className = "", ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--bluecore-focus)] ${BUTTON_STYLES[variant]} ${className}`}
      {...props}
    />
  );
}

const CONTROL =
  "w-full rounded-md border border-[var(--bluecore-border-strong)] bg-white px-3 py-1.5 text-sm text-[var(--bluecore-text)] focus:border-[var(--bluecore-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--bluecore-focus)]/20";

export function Field({ label, children, hint }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-[var(--bluecore-text)]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-[var(--bluecore-text-muted)]">{hint}</span>}
    </label>
  );
}

export function Input(props) {
  return <input className={CONTROL} {...props} />;
}

export function Textarea(props) {
  return <textarea className={CONTROL} rows={3} {...props} />;
}

export function Select({ children, ...props }) {
  return (
    <select className={CONTROL} {...props}>
      {children}
    </select>
  );
}

const BADGE_STYLES = {
  neutral: "bg-slate-100 text-slate-700",
  blue: "bg-blue-50 text-blue-800",
  brown: "bg-[var(--bluecore-brown-soft)] text-[var(--bluecore-brown)]",
  green: "bg-emerald-50 text-emerald-800",
  red: "bg-red-50 text-red-700",
};

export function Badge({ tone = "neutral", children }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[tone]}`}>
      {children}
    </span>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {message}
    </p>
  );
}

export function Card({ title, actions, children }) {
  return (
    <section className="rounded-lg border border-[var(--bluecore-border)] bg-white">
      {(title || actions) && (
        <header className="flex items-center justify-between gap-2 border-b border-[var(--bluecore-border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--bluecore-heading)]">{title}</h2>
          {actions}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--bluecore-heading)]">{title}</h1>
        {description && <p className="mt-1 text-sm text-[var(--bluecore-text-secondary)]">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
