/**
 * 模組頂層頁的 placeholder 元件。
 *
 * Phase 2.2 期間，所有尚未實作的模組頁面共用此元件，
 * 內容統一交代「此模組將在 Phase X 完成」。
 */
export function ModulePlaceholder({
  title,
  subtitle,
  specSection,
  plannedPhase,
}: {
  title: string;
  subtitle: string;
  specSection: string;
  plannedPhase: string;
}) {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
          {plannedPhase}
        </p>
        <h1 className="mt-1 text-3xl font-medium text-on-surface">{title}</h1>
        <p className="mt-2 text-sm text-on-surface-variant">{subtitle}</p>
      </header>
      <div className="rounded-2xl bg-surface p-8 ring-1 ring-outline-variant">
        <p className="text-on-surface">
          此模組尚未實作。預計於 <strong>{plannedPhase}</strong> 完成，
          詳細規格請參考 <code className="rounded bg-surface-container-high px-1.5 py-0.5 font-mono text-sm">SPEC.md {specSection}</code>。
        </p>
      </div>
    </div>
  );
}
