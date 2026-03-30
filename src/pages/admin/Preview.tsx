export function Preview() {
  return (
    <div className="space-y-6">
      <div className="brand-panel flex items-center justify-between rounded-3xl px-6 py-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Esikatselu</h1>
          <p className="mt-1 text-sm text-slate-500">Display reitittyy edelleen suoraan /display-näkymään.</p>
        </div>
        <div className="brand-wordmark text-right">
          <span className="brand-wordmark__eyebrow text-[var(--color-brand-primary)]">Eduro</span>
          <span className="brand-wordmark__title text-[var(--color-brand-ink)]">InfoTV</span>
        </div>
      </div>
      <div className="brand-panel overflow-hidden rounded-3xl p-4">
        <div className="mx-auto aspect-[16/9] w-full max-w-6xl overflow-hidden rounded-[1.75rem] border border-[var(--color-brand-border)] bg-[var(--color-brand-surface)] shadow-2xl">
          <iframe src="/display" className="h-full w-full border-0" title="InfoTV Preview" />
        </div>
      </div>
    </div>
  );
}
