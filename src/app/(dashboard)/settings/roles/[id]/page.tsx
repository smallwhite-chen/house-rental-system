import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/rbac";
import { getRoleForEdit, updateRole } from "../actions";
import { EditRoleForm } from "./edit-form";

export const metadata: Metadata = {
  title: "編輯角色 ｜ 房屋租賃管理系統",
};

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("SETTINGS_ROLES", "EDIT");
  const { id } = await params;
  const role = await getRoleForEdit(id);
  if (!role) notFound();
  if (role.isSystem) {
    return (
      <div className="space-y-6">
        <nav aria-label="breadcrumb" className="text-sm">
          <ol className="flex items-center gap-2 text-on-surface-variant">
            <li><Link href="/settings" className="hover:text-on-surface hover:underline">系統設定</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/settings/roles" className="hover:text-on-surface hover:underline">角色管理</Link></li>
            <li aria-hidden="true">›</li>
            <li className="text-on-surface">{role.name}</li>
          </ol>
        </nav>
        <div className="rounded-2xl bg-surface p-8 text-center ring-1 ring-outline-variant">
          <p className="text-on-surface-variant">系統內建角色（Super Admin）不可修改。</p>
          <Link href="/settings/roles" className="mt-4 inline-block rounded-full px-4 py-2 text-sm text-primary hover:bg-primary/8">
            返回角色管理
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/settings" className="hover:text-on-surface hover:underline">系統設定</Link></li>
          <li aria-hidden="true">›</li>
          <li><Link href="/settings/roles" className="hover:text-on-surface hover:underline">角色管理</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">編輯：{role.name}</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">編輯角色：{role.name}</h1>
        <p className="mt-1 text-sm text-on-surface-variant">修改角色名稱與各模組的存取權限</p>
      </header>

      <EditRoleForm
        roleId={role.id}
        initialName={role.name}
        initialDescription={role.description ?? ""}
        initialPermissions={role.permissions}
        updateAction={updateRole}
      />
    </div>
  );
}
