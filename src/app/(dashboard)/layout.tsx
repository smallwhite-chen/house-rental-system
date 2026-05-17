import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/rbac";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Sidebar } from "@/components/layout/Sidebar";

const FALLBACK_COMPANY_NAME = "房屋租賃管理系統";

/**
 * (dashboard) route group layout — 登入後主框架。
 *
 * 流程：
 *   1. requireUserContext() 取得使用者資料（內含 role + permissions），
 *      未登入或被停用會自動 redirect 到 /signin。
 *      該函式用 React cache()，layout + page 共用一份結果，DB 只查一次。
 *   2. 並行抓 CompanySettings；無資料則 fallback。
 *   3. 渲染 TopAppBar + Sidebar + 內容區。
 *
 * 注意：此 layout 是「驗證有 session」的守衛，並非「驗證有特定模組權限」的守衛。
 *      模組權限檢查由各模組頁面自行呼叫 requirePermission(MODULE, ACTION)。
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [ctx, companySettings] = await Promise.all([
    requireUserContext(),
    prisma.companySettings.findUnique({
      where: { id: "singleton" },
      select: { companyName: true },
    }),
  ]);

  return (
    <div className="flex h-screen flex-col bg-surface-container">
      <TopAppBar
        companyName={companySettings?.companyName ?? FALLBACK_COMPANY_NAME}
        user={{
          id: ctx.id,
          name: ctx.name,
          email: ctx.email,
          roleName: ctx.role.name,
        }}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
