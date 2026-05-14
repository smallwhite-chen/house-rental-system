/**
 * 狀態標籤 — 對應 design-system 中的 Status Chips。
 *
 * 兩種變體：
 *   - soft  ：淺底 + 圓點 + 深色字（列表頁／表格用，預設）
 *   - solid ：飽和底 + 白字（dashboard 卡片等高強調情境用）
 *
 * 顏色 token 直接取自 globals.css 的 --status-* 與 MD3 角色色。
 * 額外加入 active / disabled 兩種 tone（帳號管理用）。
 */
export type StatusTone =
  | "rented"
  | "overdue"
  | "maintenance"
  | "vacant"
  | "completed"
  | "active"
  | "disabled";

type Palette = {
  bgSolid: string;
  bgSoft: string;
  text: string;
  dot: string;
};

const PALETTE: Record<StatusTone, Palette> = {
  rented:      { bgSolid: "bg-status-rented",      bgSoft: "bg-status-rented/12",      text: "text-status-rented",      dot: "bg-status-rented" },
  overdue:     { bgSolid: "bg-status-overdue",     bgSoft: "bg-status-overdue/12",     text: "text-status-overdue",     dot: "bg-status-overdue" },
  maintenance: { bgSolid: "bg-status-maintenance", bgSoft: "bg-status-maintenance/15", text: "text-status-maintenance", dot: "bg-status-maintenance" },
  vacant:      { bgSolid: "bg-status-vacant",      bgSoft: "bg-status-vacant/15",      text: "text-status-vacant",      dot: "bg-status-vacant" },
  completed:   { bgSolid: "bg-status-completed",   bgSoft: "bg-status-completed/12",   text: "text-status-completed",   dot: "bg-status-completed" },
  // 帳號狀態：active 借用 rented（綠），disabled 借用 vacant（灰）
  active:      { bgSolid: "bg-status-rented",      bgSoft: "bg-status-rented/12",      text: "text-status-rented",      dot: "bg-status-rented" },
  disabled:    { bgSolid: "bg-status-vacant",      bgSoft: "bg-status-vacant/15",      text: "text-status-vacant",      dot: "bg-status-vacant" },
};

export function StatusChip({
  tone,
  label,
  variant = "soft",
}: {
  tone: StatusTone;
  label: string;
  variant?: "soft" | "solid";
}) {
  const p = PALETTE[tone];
  if (variant === "solid") {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white ${p.bgSolid}`}>
        {label}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${p.bgSoft} ${p.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
