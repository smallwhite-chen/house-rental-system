"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * 房產類型選擇 Modal（SPEC §4.0）。
 *
 * 點「+ 新增房產」會展開此 Modal，必選一種類型後才進入對應的新增表單：
 * - WHOLE_BUILDING → /properties/new?kind=WHOLE_BUILDING
 * - MULTI_UNIT     → /properties/new?kind=MULTI_UNIT
 *
 * 設計：整棟型卡片放左邊（業務主場景在前）；卡片內含說明 + 適用例子。
 */
export function PropertyKindModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const router = useRouter();
  const [navigating, setNavigating] = useState<"WHOLE_BUILDING" | "MULTI_UNIT" | null>(null);

  function choose(kind: "WHOLE_BUILDING" | "MULTI_UNIT") {
    setNavigating(kind);
    router.push(`/properties/new?kind=${kind}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-3xl rounded-3xl bg-surface p-6 shadow-xl ring-1 ring-outline-variant">
        <div className="mb-1 flex items-start justify-between">
          <h2 className="text-xl font-medium text-on-surface">新增哪種房產？</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container"
            aria-label="關閉"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        <p className="mb-5 text-sm text-on-surface-variant">
          一經建立<strong className="text-on-surface">不可變更</strong>。請依實際業務情境選擇。
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <KindCard
            kind="WHOLE_BUILDING"
            emoji="🏪"
            title="整棟型"
            subtitle="店面、整層出租、獨棟透天"
            bullets={[
              "整棟即合約主體",
              "不需建立房間單位",
              "適合：信義店面、忠孝整層",
            ]}
            highlight
            disabled={navigating !== null}
            onClick={() => choose("WHOLE_BUILDING")}
          />
          <KindCard
            kind="MULTI_UNIT"
            emoji="🏢"
            title="多單位型"
            subtitle="套房大樓、分租公寓"
            bullets={[
              "一個房產有多個房間",
              "每個房間獨立簽約",
              "適合：松江大樓 16 間套房",
            ]}
            disabled={navigating !== null}
            onClick={() => choose("MULTI_UNIT")}
          />
        </div>
      </div>
    </div>
  );
}

function KindCard({
  emoji,
  title,
  subtitle,
  bullets,
  highlight,
  disabled,
  onClick,
}: {
  kind: "WHOLE_BUILDING" | "MULTI_UNIT";
  emoji: string;
  title: string;
  subtitle: string;
  bullets: string[];
  highlight?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex flex-col rounded-2xl border-2 p-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
        highlight
          ? "border-primary/40 bg-primary-container/30 hover:border-primary hover:bg-primary-container/50"
          : "border-outline-variant bg-surface hover:border-primary hover:bg-primary-container/20"
      }`}
    >
      <div className="mb-2 flex items-center gap-3">
        <span className="text-3xl">{emoji}</span>
        <div>
          <p className="text-lg font-medium text-on-surface">{title}</p>
          <p className="text-xs text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      <ul className="mt-2 space-y-1 text-sm text-on-surface-variant">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-status-rented">✓</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}
