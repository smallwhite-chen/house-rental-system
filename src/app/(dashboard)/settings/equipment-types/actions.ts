"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

const PATH = "/settings/equipment-types";
const MODULE = "SETTINGS_EQUIPMENT_TYPES" as const;
const TARGET = "EquipmentType";

export async function createEquipmentType(fd: FormData) {
  const ctx = await requirePermission(MODULE, "CREATE");
  const name = (fd.get("name") as string)?.trim();
  const description = (fd.get("description") as string)?.trim() || null;
  if (!name) return { error: "種類名稱為必填" };
  try {
    const item = await prisma.equipmentType.create({ data: { name, description } });
    await logAudit({ userId: ctx.id, module: MODULE, action: "CREATE", targetType: TARGET, targetId: item.id, changes: { after: { name, description } } });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "此種類名稱已存在，請使用不同名稱" };
  }
}

export async function updateEquipmentType(id: string, fd: FormData) {
  const ctx = await requirePermission(MODULE, "EDIT");
  const name = (fd.get("name") as string)?.trim();
  const description = (fd.get("description") as string)?.trim() || null;
  if (!name) return { error: "種類名稱為必填" };
  try {
    const before = await prisma.equipmentType.findUnique({ where: { id }, select: { name: true, description: true } });
    await prisma.equipmentType.update({ where: { id }, data: { name, description } });
    await logAudit({ userId: ctx.id, module: MODULE, action: "UPDATE", targetType: TARGET, targetId: id, changes: { before, after: { name, description } } });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "此種類名稱已存在，請使用不同名稱" };
  }
}

export async function deleteEquipmentType(id: string) {
  const ctx = await requirePermission(MODULE, "DELETE");
  try {
    const item = await prisma.equipmentType.findUnique({ where: { id }, select: { name: true } });
    await prisma.equipmentType.delete({ where: { id } });
    await logAudit({ userId: ctx.id, module: MODULE, action: "DELETE", targetType: TARGET, targetId: id, changes: { before: item } });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "此種類正在被設備清單使用中，無法刪除" };
  }
}
