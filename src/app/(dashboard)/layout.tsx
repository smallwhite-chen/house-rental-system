import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Sidebar } from "@/components/layout/Sidebar";

const FALLBACK_COMPANY_NAME = "房屋租賃管理系統";

/**
 * (dashboard) route group layout — 登入後主框架。
 *
 * 流程：
 *   1. 驗證 session，未登入導向 /signin
 *   2. 從 DB 撈出使用者完整資料（含角色名稱）
 *   3. 從 DB 撈 CompanySettings（singleton），無資料則用 fallback
 *   4. 渲染 TopAppBar + Sidebar + 內容區
 *
 * 注意：此 layout 跑在每次 dashboard 頁面 request，相當於全域權限守衛。
 * Phase 2.3 會再加上 RBAC permission 檢查（依路徑判定 module 並查 RolePermission）。
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const [user, companySettings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        status: true,
        role: { select: { name: true } },
      },
    }),
    prisma.companySettings.findUnique({
      where: { id: "singleton" },
      select: { companyName: true },
    }),
  ]);

  // 使用者在 session 還在但 DB 已刪除，或被停用時，強制登出
  if (!user || user.status !== "ACTIVE") {
    redirect("/signin");
  }

  return (
    <div className="flex h-screen flex-col bg-surface-container">
      <TopAppBar
        companyName={companySettings?.companyName ?? FALLBACK_COMPANY_NAME}
        user={{
          name: user.name,
          email: user.email,
          roleName: user.role.name,
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
