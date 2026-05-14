import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { NewAccountForm } from "./account-form";

export const metadata: Metadata = {
  title: "新增帳號 ｜ 房屋租賃管理系統",
};

/**
 * 新增帳號頁。
 *
 * 權限：SETTINGS_ACCOUNTS × CREATE。
 * 列出所有角色（從 Role 表）給下拉選擇。
 */
export default async function NewAccountPage() {
  await requirePermission("SETTINGS_ACCOUNTS", "CREATE");

  const roles = await prisma.role.findMany({
    orderBy: [{ isSystem: "desc" }, { name: "asc" }], // Super Admin 列在最上
    select: { id: true, name: true, isSystem: true },
  });

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/settings" className="hover:text-on-surface hover:underline">系統設定</Link></li>
          <li aria-hidden="true">›</li>
          <li><Link href="/settings/accounts" className="hover:text-on-surface hover:underline">帳號管理</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">新增帳號</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">新增帳號</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          建立後請將初始密碼以安全方式（如當面、加密訊息）告知使用者
        </p>
      </header>

      <div className="rounded-2xl bg-surface p-8 ring-1 ring-outline-variant">
        <NewAccountForm roles={roles} />
      </div>
    </div>
  );
}
