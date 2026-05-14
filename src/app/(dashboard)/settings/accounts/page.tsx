import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";

export const metadata: Metadata = {
  title: "帳號管理 ｜ 房屋租賃管理系統",
};

/**
 * 帳號列表頁（SPEC §3.2）。
 *
 * 顯示所有系統使用者（公司端管理者）：姓名、Email、角色、狀態、建立時間。
 * 點任一列進入編輯頁；右上「新增帳號」按鈕進入新增頁。
 *
 * 權限：SETTINGS_ACCOUNTS × VIEW。
 */
export default async function AccountsListPage() {
  await requirePermission("SETTINGS_ACCOUNTS", "VIEW");

  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
      role: { select: { name: true, isSystem: true } },
    },
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/settings" className="hover:text-on-surface hover:underline">系統設定</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">帳號管理</li>
        </ol>
      </nav>

      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-medium text-on-surface">帳號管理</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            管理使用者帳號（共 {users.length} 個）
          </p>
        </div>
        <Link href="/settings/accounts/new">
          <Button variant="filled" leadingIcon={<PlusIcon />}>新增帳號</Button>
        </Link>
      </header>

      <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-outline-variant">
        <table className="w-full">
          <thead className="bg-surface-container-high text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
            <tr>
              <th className="px-6 py-3">姓名</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">角色</th>
              <th className="px-6 py-3">狀態</th>
              <th className="px-6 py-3 whitespace-nowrap">建立時間</th>
              <th className="px-6 py-3 text-right whitespace-nowrap"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
            {users.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-surface-container">
                <td className="px-6 py-4 font-medium">{u.name}</td>
                <td className="px-6 py-4 text-on-surface-variant">{u.email}</td>
                <td className="px-6 py-4">
                  {u.role.isSystem ? (
                    <span className="inline-flex items-center rounded-full bg-primary-container px-2 py-0.5 text-xs font-medium text-on-primary-container">
                      {u.role.name}
                    </span>
                  ) : (
                    u.role.name
                  )}
                </td>
                <td className="px-6 py-4">
                  <StatusChip
                    tone={u.status === "ACTIVE" ? "active" : "disabled"}
                    label={u.status === "ACTIVE" ? "啟用" : "停用"}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-on-surface-variant">
                  {u.createdAt.toLocaleString("zh-TW", { hour12: false })}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <Link
                    href={`/settings/accounts/${u.id}`}
                    className="inline-block rounded-full px-3 py-1 text-sm text-primary hover:bg-primary/8"
                  >
                    編輯
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
    </svg>
  );
}
