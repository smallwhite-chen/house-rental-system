"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/rbac";

/**
 * 通知中心的個人化 CRUD。
 *
 * 權限模型：使用者只能操作「自己」的通知，不需另設 module 權限。
 * 所有 action 在 server 端強制 where userId = currentUser.id。
 */

export async function markAsRead(id: string) {
  const ctx = await requireUserContext();
  try {
    const result = await prisma.notification.updateMany({
      where: { id, userId: ctx.id, readAt: null },
      data: { readAt: new Date() },
    });
    revalidatePath("/notifications");
    revalidatePath("/dashboard");
    return { ok: true as const, updated: result.count };
  } catch (e) {
    console.error("[notification:markAsRead]", e);
    return { error: "更新失敗，請稍後再試" };
  }
}

export async function markAllAsRead() {
  const ctx = await requireUserContext();
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: ctx.id, readAt: null },
      data: { readAt: new Date() },
    });
    revalidatePath("/notifications");
    revalidatePath("/dashboard");
    return { ok: true as const, updated: result.count };
  } catch (e) {
    console.error("[notification:markAllAsRead]", e);
    return { error: "更新失敗，請稍後再試" };
  }
}

export async function deleteNotification(id: string) {
  const ctx = await requireUserContext();
  try {
    await prisma.notification.deleteMany({
      where: { id, userId: ctx.id },
    });
    revalidatePath("/notifications");
    revalidatePath("/dashboard");
    return { ok: true as const };
  } catch (e) {
    console.error("[notification:delete]", e);
    return { error: "刪除失敗，請稍後再試" };
  }
}
