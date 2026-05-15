import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { RolesClient } from "./client";
import { deleteRole } from "./actions";

export const metadata: Metadata = {
  title: "角色管理 ｜ 房屋租賃管理系統",
};

export default async function RolesPage() {
  const ctx = await requirePermission("SETTINGS_ROLES", "VIEW");
  const canCreate = hasPermission(ctx, "SETTINGS_ROLES", "CREATE");

  const roles = await prisma.role.findMany({
    orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { users: true } },
      permissions: { select: { module: true, action: true } },
    },
  });

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/settings" className="hover:text-on-surface hover:underline">系統設定</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">角色管理</li>
        </ol>
      </nav>

      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-medium text-on-surface">角色管理</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            管理自訂角色與各模組權限設定（共 {roles.length} 個角色）
          </p>
        </div>
        {canCreate && (
          <Link href="/settings/roles/new">
            <button className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-on-primary shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <PlusIcon />
              新增角色
            </button>
          </Link>
        )}
      </header>

      <div className="space-y-3">
        {roles.map((role) => (
          <div key={role.id} className="overflow-hidden rounded-2xl bg-surface ring-1 ring-outline-variant">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                {role.isSystem ? (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary">
                    <ShieldIcon />
                  </span>
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                    <KeyIcon />
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-on-surface">{role.name}</span>
                    {role.isSystem && (
                      <span className="rounded-full bg-primary-container px-2 py-0.5 text-xs font-medium text-on-primary-container">
                        系統內建
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-sm text-on-surface-variant">{role.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-on-surface-variant">
                  {role._count.users} 個帳號
                </span>
                {!role.isSystem && (
                  <RolesClient roleId={role.id} roleName={role.name} userCount={role._count.users} deleteAction={deleteRole} />
                )}
                {!role.isSystem && (
                  <Link
                    href={`/settings/roles/${role.id}`}
                    className="rounded-full px-3 py-1 text-sm text-primary hover:bg-primary/8"
                  >
                    編輯
                  </Link>
                )}
              </div>
            </div>
            {!role.isSystem && role.permissions.length > 0 && (
              <div className="border-t border-outline-variant px-6 py-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                  已授權模組（{role.permissions.length} 項）
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(new Set(role.permissions.map((p) => p.module))).map((mod) => (
                    <span key={mod} className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs text-on-surface-variant">
                      {MOD_LABELS[mod] ?? mod}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {role.isSystem && (
              <div className="border-t border-outline-variant px-6 py-3">
                <p className="text-xs text-on-surface-variant">
                  Super Admin 擁有所有系統權限，不受模組設定限制。
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const MOD_LABELS: Partial<Record<string, string>> = {
  SETTINGS_GENERAL: "系統基本設定",
  SETTINGS_ACCOUNTS: "帳號管理",
  SETTINGS_ROLES: "角色管理",
  SETTINGS_NOTIFICATIONS: "通知設定",
  SETTINGS_PAYMENT_METHODS: "收款方式",
  SETTINGS_PROPERTY_TYPES: "房產種類",
  SETTINGS_INCOME_TYPES: "收入種類",
  SETTINGS_EXPENSE_TYPES: "支出種類",
  SETTINGS_EQUIPMENT_TYPES: "設備種類",
  SETTINGS_COMMUNICATION_TAGS: "溝通標籤",
  SETTINGS_AUDIT_LOG: "稽核紀錄",
  DASHBOARD: "儀表板",
  PROPERTIES: "房產管理",
  TENANTS: "房客管理",
  CONTRACTS: "合約管理",
  INVOICES: "帳單管理",
  PAYMENTS: "收款紀錄",
  REPORTS: "財務報表",
  EXPENSES: "支出管理",
  COMMUNICATIONS: "溝通與維修",
};

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 0 1 .678 0 11.947 11.947 0 0 0 7.078 2.749.5.5 0 0 1 .479.425c.069.52.104 1.05.104 1.589 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 0 1-.332 0C5.26 16.563 2 12.162 2 7c0-.538.035-1.069.104-1.589a.5.5 0 0 1 .48-.425 11.947 11.947 0 0 0 7.077-2.749Zm4.196 5.954a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path fillRule="evenodd" d="M8 7a5 5 0 1 1 3.61 4.804l-1.903 1.903A1 1 0 0 1 9 14H8v1a1 1 0 0 1-1 1H6v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 .293-.707L8.196 8.39A5.002 5.002 0 0 1 8 7Zm5-3a.75.75 0 0 0 0 1.5A1.5 1.5 0 0 1 14.5 7 .75.75 0 0 0 16 7a3 3 0 0 0-3-3Z" clipRule="evenodd" />
    </svg>
  );
}
