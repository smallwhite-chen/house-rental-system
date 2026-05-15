import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/rbac";
import { RoleForm } from "./role-form";
import { createRole } from "../actions";

export const metadata: Metadata = {
  title: "新增角色 ｜ 房屋租賃管理系統",
};

export default async function NewRolePage() {
  await requirePermission("SETTINGS_ROLES", "CREATE");

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/settings" className="hover:text-on-surface hover:underline">系統設定</Link></li>
          <li aria-hidden="true">›</li>
          <li><Link href="/settings/roles" className="hover:text-on-surface hover:underline">角色管理</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">新增角色</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">新增角色</h1>
        <p className="mt-1 text-sm text-on-surface-variant">建立自訂角色並設定各模組的存取權限</p>
      </header>

      <RoleForm createAction={createRole} />
    </div>
  );
}
