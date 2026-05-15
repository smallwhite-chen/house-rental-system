"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

const PATH = "/settings/property-types";
const MODULE = "SETTINGS_PROPERTY_TYPES" as const;
const TARGET = "PropertyType";

export async function createPropertyType(fd: FormData) {
  const ctx = await requirePermission(MODULE, "CREATE");
  const name = (fd.get("name") as string)?.trim();
  const description = (fd.get("description") as string)?.trim() || null;
  if (!name) return { error: "種類名稱為必填" };
  try {
    const item = await prisma.propertyType.create({ data: { name, description } });
    await logAudit({ userId: ctx.id, module: MODULE, action: "CREATE", targetType: TARGET, targetId: item.id, changes: { after: { name, description } } });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "此種類名稱已存在，請使用不同名稱" };
  }
}

export async function updatePropertyType(id: string, fd: FormData) {
  const ctx = await requirePermission(MODULE, "EDIT");
  const name = (fd.get("name") as string)?.trim();
  const description = (fd.get("description") as string)?.trim() || null;
  if (!name) return { error: "種類名稱為必填" };
  try {
    const before = await prisma.propertyType.findUnique({ where: { id }, select: { name: true, description: true } });
    await prisma.propertyType.update({ where: { id }, data: { name, description } });
    await logAudit({ userId: ctx.id, module: MODULE, action: "UPDATE", targetType: TARGET, targetId: id, changes: { before, after: { name, description } } });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "此種類名稱已存在，請使用不同名稱" };
  }
}

export async function deletePropertyType(id: string) {
  const ctx = await requirePermission(MODULE, "DELETE");
  try {
    const item = await prisma.propertyType.findUnique({ where: { id }, select: { name: true } });
    await prisma.propertyType.delete({ where: { id } });
    await logAudit({ userId: ctx.id, module: MODULE, action: "DELETE", targetType: TARGET, targetId: id, changes: { before: item } });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "此種類正在被房產使用中，無法刪除" };
  }
}
