"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

const PATH = "/settings/communication-tags";
const MODULE = "SETTINGS_COMMUNICATION_TAGS" as const;
const TARGET = "CommunicationTag";

export async function createCommunicationTag(fd: FormData) {
  const ctx = await requirePermission(MODULE, "CREATE");
  const name = (fd.get("name") as string)?.trim();
  const description = (fd.get("description") as string)?.trim() || null;
  if (!name) return { error: "標籤名稱為必填" };
  try {
    const item = await prisma.communicationTag.create({ data: { name, description } });
    await logAudit({ userId: ctx.id, module: MODULE, action: "CREATE", targetType: TARGET, targetId: item.id, changes: { after: { name, description } } });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "此標籤名稱已存在，請使用不同名稱" };
  }
}

export async function updateCommunicationTag(id: string, fd: FormData) {
  const ctx = await requirePermission(MODULE, "EDIT");
  const name = (fd.get("name") as string)?.trim();
  const description = (fd.get("description") as string)?.trim() || null;
  if (!name) return { error: "標籤名稱為必填" };
  try {
    const before = await prisma.communicationTag.findUnique({ where: { id }, select: { name: true, description: true } });
    await prisma.communicationTag.update({ where: { id }, data: { name, description } });
    await logAudit({ userId: ctx.id, module: MODULE, action: "UPDATE", targetType: TARGET, targetId: id, changes: { before, after: { name, description } } });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "此標籤名稱已存在，請使用不同名稱" };
  }
}

export async function deleteCommunicationTag(id: string) {
  const ctx = await requirePermission(MODULE, "DELETE");
  try {
    const item = await prisma.communicationTag.findUnique({ where: { id }, select: { name: true } });
    await prisma.communicationTag.delete({ where: { id } });
    await logAudit({ userId: ctx.id, module: MODULE, action: "DELETE", targetType: TARGET, targetId: id, changes: { before: item } });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "此標籤正在被溝通紀錄使用中，無法刪除" };
  }
}
