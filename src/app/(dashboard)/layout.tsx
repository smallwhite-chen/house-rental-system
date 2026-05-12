import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * (dashboard) route group layout
 * - 強制登入：未登入導向 /signin
 * - 後續 Phase 2 會加入側邊導覽列、頂部 app bar、公司名稱顯示等。
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-surface-container">
      {/* TODO Phase 2: 側邊導覽列（系統設定 / 房產 / 房客 / 合約 / 租金 / 溝通 / Dashboard） */}
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
