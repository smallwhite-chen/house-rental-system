import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard ｜ 房屋租賃管理系統",
};

/**
 * Phase 0 placeholder。
 * Phase 8 會回頭實作：
 *   - 出租狀況總覽（出租中/空置/合約逾期/整修中）
 *   - 本月收租狀況（已收款/未收款/逾期）
 *   - 近期合約到期提醒
 *   - 待處理溝通事項
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-medium text-on-surface">Dashboard</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          系統首頁將顯示出租狀況、收租狀況、合約到期提醒等。
        </p>
      </header>
      <div className="rounded-2xl bg-surface p-8 ring-1 ring-outline-variant">
        <p className="text-on-surface-variant">
          Dashboard 內容尚未實作（規格 §10，Phase 8 會完成）。
        </p>
      </div>
    </div>
  );
}
