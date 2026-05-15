"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ModuleKey, PermissionAction } from "@/generated/prisma/client";

const PATH = "/settings/roles";
const MODULE = "SETTINGS_ROLES" as const;

const ALL_ACTIONS: PermissionAction[] = ["VIEW", "CREATE", "EDIT", "DELETE"];

function parsePermissions(fd: FormData): Array<{ module: ModuleKey; action: PermissionAction }> {
  const perms: Array<{ module: ModuleKey; action: PermissionAction }> = [];
  for (const action of ALL_ACTIONS) {
    for (const [key, value] of fd.entries()) {
      if (key === `perm_${action}` && value) {
        perms.push({ module: value as ModuleKey, action });
      }
    }
  }
  // Alternative: checkboxes named "perm_MODULE_ACTION"
  for (const [key] of fd.entries()) {
    const match = key.match(/^perm_(.+)_(VIEW|CREATE|EDIT|DELETE)$/);
    if (match) {
      const module = match[1] as ModuleKey;
      const action = match[2] as PermissionAction;
      if (!perms.some((p) => p.module === module && p.action === action)) {
        perms.push({ module, action });
      }
    }
  }
  return perms;
}

export async function createRole(fd: FormData) {
  const ctx = await requirePermission(MODULE, "CREATE");
  const name = (fd.get("name") as string)?.trim();
  const description = (fd.get("description") as string)?.trim() || null;
  if (!name) return { error: "角色名稱為必填" };

  const perms = parsePermissions(fd);

  try {
    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: { create: perms },
      },
    });
    await logAudit({ userId: ctx.id, module: MODULE, action: "CREATE", targetType: "Role", targetId: role.id, changes: { after: { name, description, permissions: perms.length } } });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "此角色名稱已存在，請使用不同名稱" };
  }
}

export async function updateRole(id: string, fd: FormData) {
  const ctx = await requirePermission(MODULE, "EDIT");

  const existing = await prisma.role.findUnique({ where: { id }, select: { isSystem: true, name: true } });
  if (!existing) return { error: "角色不存在" };
  if (existing.isSystem) return { error: "系統內建角色不可修改" };

  const name = (fd.get("name") as string)?.trim();
  const description = (fd.get("description") as string)?.trim() || null;
  if (!name) return { error: "角色名稱為必填" };

  const perms = parsePermissions(fd);

  try {
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      prisma.role.update({
        where: { id },
        data: {
          name,
          description,
          permissions: { create: perms },
        },
      }),
    ]);
    await logAudit({ userId: ctx.id, module: MODULE, action: "UPDATE", targetType: "Role", targetId: id, changes: { before: { name: existing.name }, after: { name, permissions: perms.length } } });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "此角色名稱已存在，請使用不同名稱" };
  }
}

export async function deleteRole(id: string) {
  const ctx = await requirePermission(MODULE, "DELETE");

  const role = await prisma.role.findUnique({
    where: { id },
    select: { isSystem: true, name: true, _count: { select: { users: true } } },
  });
  if (!role) return { error: "角色不存在" };
  if (role.isSystem) return { error: "系統內建角色不可刪除" };
  if (role._count.users > 0) return { error: `此角色目前有 ${role._count.users} 個帳號使用中，請先將帳號改為其他角色後再刪除` };

  try {
    await prisma.role.delete({ where: { id } });
    await logAudit({ userId: ctx.id, module: MODULE, action: "DELETE", targetType: "Role", targetId: id, changes: { before: { name: role.name } } });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "刪除失敗，請稍後再試" };
  }
}

export async function getRoleForEdit(id: string) {
  await requirePermission(MODULE, "VIEW");
  return prisma.role.findUnique({
    where: { id },
    include: { permissions: { select: { module: true, action: true } } },
  });
}
