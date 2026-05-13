import type { Metadata } from "next";
import { requireUserContext } from "@/lib/rbac";

export const metadata: Metadata = {
  title: "Dashboard ｜ 房屋租賃管理系統",
};

/**
 * Dashboard 首頁。
 *
 * Phase 2.3：使用 requireUserContext() 取得使用者資料；該函式以 React cache 共用 layout
 * 的查詢結果，不會多打一次 DB。
 *
 * Phase 8 會回頭實作（規格 §10）：
 *   - 出租狀況總覽
 *   - 本月收租狀況
 *   - 近期合約到期提醒
 *   - 待處理溝通事項
 */
export default async function DashboardPage() {
  const ctx = await requireUserContext();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-medium text-on-surface">
          歡迎回來，{ctx.name}
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          目前系統處於開發階段，各模組將依規劃陸續上線。
        </p>
      </header>

      <div className="rounded-2xl bg-primary-container p-6 text-on-primary-container">
        <h2 className="text-lg font-medium">系統就緒</h2>
        <p className="mt-2 text-sm">
          資料庫已建好（30 個資料表）、Super Admin 已建立、登入流程已上線、RBAC 引擎已就位。
          可使用左側選單瀏覽各模組。
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-on-surface-variant">
          各模組狀態
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ProgressCard module="登入／RBAC" status="進行中" phase="Phase 2" />
          <ProgressCard module="系統設定" status="待開發" phase="Phase 2.4 ~ 2.9" />
          <ProgressCard module="房產管理" status="待開發" phase="Phase 3" />
          <ProgressCard module="房客管理" status="待開發" phase="Phase 4" />
          <ProgressCard module="合約管理" status="待開發" phase="Phase 5" />
          <ProgressCard module="租金管理" status="待開發" phase="Phase 6" />
          <ProgressCard module="溝通與維修" status="待開發" phase="Phase 7" />
          <ProgressCard module="Dashboard 統計" status="待開發" phase="Phase 8" />
        </div>
      </section>
    </div>
  );
}

function ProgressCard({
  module,
  status,
  phase,
}: {
  module: string;
  status: "進行中" | "待開發" | "已完成";
  phase: string;
}) {
  const statusColors: Record<string, string> = {
    進行中: "bg-status-completed/12 text-status-completed",
    待開發: "bg-surface-container-high text-on-surface-variant",
    已完成: "bg-status-rented/12 text-status-rented",
  };
  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-outline-variant">
      <p className="text-sm font-medium text-on-surface">{module}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status]}`}>
          {status}
        </span>
        <span className="font-mono text-xs text-on-surface-variant">{phase}</span>
      </div>
    </div>
  );
}
