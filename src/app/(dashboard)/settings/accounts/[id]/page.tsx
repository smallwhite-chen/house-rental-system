import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { EditAccountForm } from "./edit-form";
import { ResetPasswordButton } from "./reset-password-button";

export const metadata: Metadata = {
  title: "編輯帳號 ｜ 房屋租賃管理系統",
};

/**
 * 編輯帳號頁。
 *
 * 權限：SETTINGS_ACCOUNTS × VIEW（編輯送出時再以 EDIT 檢查）。
 * 提供：
 *   - 基本資料表單（姓名、Email、角色、狀態、備註）
 *   - 重設密碼（獨立區塊；點擊產生隨機密碼一次性顯示給管理者）
 */
export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("SETTINGS_ACCOUNTS", "VIEW");
  const { id } = await params;

  const [user, roles] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        note: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
        role: { select: { name: true, isSystem: true } },
      },
    }),
    prisma.role.findMany({
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      select: { id: true, name: true, isSystem: true },
    }),
  ]);

  if (!user) notFound();

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/settings" className="hover:text-on-surface hover:underline">系統設定</Link></li>
          <li aria-hidden="true">›</li>
          <li><Link href="/settings/accounts" className="hover:text-on-surface hover:underline">帳號管理</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">{user.name}</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">編輯帳號</h1>
        <p className="mt-1 font-mono text-xs text-on-surface-variant">
          建立於 {user.createdAt.toLocaleString("zh-TW", { hour12: false })} ／
          最後更新 {user.updatedAt.toLocaleString("zh-TW", { hour12: false })}
        </p>
      </header>

      {/* 基本資料 */}
      <div className="rounded-2xl bg-surface p-8 ring-1 ring-outline-variant">
        <h2 className="mb-6 text-sm font-medium uppercase tracking-wide text-on-surface-variant">
          基本資料
        </h2>
        <EditAccountForm
          userId={user.id}
          initial={{
            name: user.name,
            email: user.email,
            roleId: user.roleId,
            status: user.status,
            note: user.note ?? "",
          }}
          roles={roles}
          isSuperAdmin={user.role.isSystem}
        />
      </div>

      {/* 重設密碼 */}
      <div className="rounded-2xl bg-surface p-8 ring-1 ring-outline-variant">
        <h2 className="text-sm font-medium uppercase tracking-wide text-on-surface-variant">
          密碼管理
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          系統會產生一組隨機 12 碼密碼並一次性顯示，請務必複製並以安全方式告知使用者。
        </p>
        <div className="mt-4">
          <ResetPasswordButton userId={user.id} userName={user.name} />
        </div>
      </div>
    </div>
  );
}
