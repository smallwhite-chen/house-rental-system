"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { CommunicationStatus } from "@/generated/prisma/client";

const MODULE = "COMMUNICATIONS" as const;
const TARGET = "CommunicationLog";

type ParsedLog = {
  unitId: string;
  tenantId: string;
  communicationDate: Date;
  content: string;
  attachmentUrl: string | null;
  status: CommunicationStatus;
  note: string | null;
  tagIds: string[];
};

function parseForm(fd: FormData): { error: string } | ParsedLog {
  const unitId = (fd.get("unitId") as string)?.trim();
  const tenantId = (fd.get("tenantId") as string)?.trim();
  const dateStr = (fd.get("communicationDate") as string)?.trim();
  const content = (fd.get("content") as string)?.trim();
  const attachmentUrl = ((fd.get("attachmentUrl") as string) ?? "").trim() || null;
  const statusRaw = (fd.get("status") as string)?.trim();
  const note = ((fd.get("note") as string) ?? "").trim() || null;
  const tagIds = fd.getAll("tagIds").map((v) => v.toString()).filter(Boolean);

  if (!unitId) return { error: "請選擇關聯房間" };
  if (!tenantId) return { error: "請選擇關聯房客" };
  if (!dateStr) return { error: "溝通日期為必填" };
  const communicationDate = new Date(dateStr);
  if (Number.isNaN(+communicationDate)) return { error: "溝通日期格式無效" };
  if (!content) return { error: "溝通內容為必填" };
  if (statusRaw !== "PENDING" && statusRaw !== "IN_PROGRESS" && statusRaw !== "COMPLETED") {
    return { error: "處理狀態無效" };
  }
  if (tagIds.length === 0) return { error: "請至少選擇一個標籤" };

  return {
    unitId,
    tenantId,
    communicationDate,
    content,
    attachmentUrl,
    status: statusRaw as CommunicationStatus,
    note,
    tagIds,
  };
}

export async function createCommunicationLog(fd: FormData) {
  const ctx = await requirePermission(MODULE, "CREATE");
  const parsed = parseForm(fd);
  if ("error" in parsed) return { error: parsed.error };

  try {
    const created = await prisma.$transaction(async (tx) => {
      const log = await tx.communicationLog.create({
        data: {
          unitId: parsed.unitId,
          tenantId: parsed.tenantId,
          communicationDate: parsed.communicationDate,
          content: parsed.content,
          attachmentUrl: parsed.attachmentUrl,
          status: parsed.status,
          note: parsed.note,
        },
      });
      if (parsed.tagIds.length > 0) {
        await tx.communicationLogTag.createMany({
          data: parsed.tagIds.map((tagId) => ({ logId: log.id, tagId })),
        });
      }
      return log;
    });

    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "CREATE",
      targetType: TARGET,
      targetId: created.id,
      changes: {
        after: { unitId: parsed.unitId, tenantId: parsed.tenantId, status: parsed.status },
      },
    });

    revalidatePath("/communications");
    return { ok: true as const, id: created.id };
  } catch (e) {
    console.error("[communication:create]", e);
    return { error: "建立溝通紀錄失敗，請稍後再試" };
  }
}

export async function updateCommunicationLog(id: string, fd: FormData) {
  const ctx = await requirePermission(MODULE, "EDIT");
  const parsed = parseForm(fd);
  if ("error" in parsed) return { error: parsed.error };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.communicationLog.update({
        where: { id },
        data: {
          unitId: parsed.unitId,
          tenantId: parsed.tenantId,
          communicationDate: parsed.communicationDate,
          content: parsed.content,
          attachmentUrl: parsed.attachmentUrl,
          status: parsed.status,
          note: parsed.note,
        },
      });
      // 標籤關聯採全量重建（與設備清單相同模式）
      await tx.communicationLogTag.deleteMany({ where: { logId: id } });
      if (parsed.tagIds.length > 0) {
        await tx.communicationLogTag.createMany({
          data: parsed.tagIds.map((tagId) => ({ logId: id, tagId })),
        });
      }
    });

    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "UPDATE",
      targetType: TARGET,
      targetId: id,
    });

    revalidatePath("/communications");
    revalidatePath(`/communications/${id}/edit`);
    return { ok: true as const };
  } catch (e) {
    console.error("[communication:update]", e);
    return { error: "更新失敗，請稍後再試" };
  }
}

export async function deleteCommunicationLog(id: string) {
  const ctx = await requirePermission(MODULE, "DELETE");
  try {
    await prisma.communicationLog.delete({ where: { id } });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "DELETE",
      targetType: TARGET,
      targetId: id,
    });
  } catch (e) {
    console.error("[communication:delete]", e);
    return { error: "刪除失敗，請稍後再試" };
  }
  revalidatePath("/communications");
  redirect("/communications");
}
