"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { NotificationEventKey } from "@/generated/prisma/client";

const MODULE = "SETTINGS_NOTIFICATIONS" as const;
const PATH = "/settings/notifications";

// ─── 通知管道設定（singleton） ───────────────────────────────────────────────

export async function updateChannelSettings(fd: FormData) {
  const ctx = await requirePermission(MODULE, "EDIT");

  const emailSenderName = (fd.get("emailSenderName") as string)?.trim();
  const emailSenderAddress = (fd.get("emailSenderAddress") as string)?.trim();
  const emailEnabled = fd.get("emailEnabled") === "on";
  const inAppEnabled = fd.get("inAppEnabled") === "on";

  if (!emailSenderName) return { error: "寄件者名稱為必填" };
  if (!emailSenderAddress) return { error: "寄件者 Email 為必填" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailSenderAddress)) {
    return { error: "寄件者 Email 格式不正確" };
  }

  try {
    await prisma.notificationChannelSettings.upsert({
      where: { id: "singleton" },
      update: { emailSenderName, emailSenderAddress, emailEnabled, inAppEnabled },
      create: {
        id: "singleton",
        emailSenderName,
        emailSenderAddress,
        emailEnabled,
        inAppEnabled,
      },
    });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "UPDATE",
      targetType: "NotificationChannelSettings",
      targetId: "singleton",
      changes: { after: { emailSenderName, emailSenderAddress, emailEnabled, inAppEnabled } },
    });
    revalidatePath(PATH);
    return { ok: true as const };
  } catch (e) {
    console.error("[channel:update]", e);
    return { error: "更新失敗，請稍後再試" };
  }
}

// ─── 事件模板：僅切換啟用/停用（名稱由系統預設，不可修改） ─────────────────
// 設計考量：事件名稱代表「系統觸發點」，改名會讓未來維運看不懂原始意義，故鎖定。

export async function toggleEventTemplate(
  eventKey: NotificationEventKey,
  enabled: boolean
): Promise<{ ok?: true; error?: string }> {
  const ctx = await requirePermission(MODULE, "EDIT");
  try {
    await prisma.notificationEventTemplate.update({
      where: { eventKey },
      data: { enabled },
    });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "UPDATE",
      targetType: "NotificationEventTemplate",
      targetId: eventKey,
      changes: { after: { enabled } },
    });
    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    console.error("[event:toggle]", e);
    return { error: "更新失敗，請稍後再試" };
  }
}

// ─── 通知規則 CRUD ───────────────────────────────────────────────────────────

type ParsedRule = {
  eventKey: NotificationEventKey;
  daysOffset: number | null;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  title: string;
  body: string;
  enabled: boolean;
  recipientIds: string[];
};

function parseRuleForm(fd: FormData): { error: string } | ParsedRule {
  const eventKey = (fd.get("eventKey") as string)?.trim() as NotificationEventKey;
  const daysOffsetStr = (fd.get("daysOffset") as string)?.trim();
  const emailEnabled = fd.get("emailEnabled") === "on";
  const inAppEnabled = fd.get("inAppEnabled") === "on";
  const title = (fd.get("title") as string)?.trim();
  const body = (fd.get("body") as string)?.trim();
  const enabled = fd.get("enabled") === "on";
  const recipientIds = fd.getAll("recipientIds").map((v) => String(v)).filter(Boolean);

  if (!eventKey) return { error: "請選擇觸發事件" };
  if (!title) return { error: "通知標題為必填" };
  if (!body) return { error: "通知內容為必填" };
  if (body.length > 500) return { error: "通知內容長度不可超過 500 字" };
  if (!emailEnabled && !inAppEnabled) return { error: "請至少選一個通知管道" };
  if (recipientIds.length === 0) return { error: "請至少選一個通知對象" };

  // 時間型才允許 daysOffset；事件型留空
  let daysOffset: number | null = null;
  if (daysOffsetStr) {
    const n = Number(daysOffsetStr);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      return { error: "提前/延後天數需為整數" };
    }
    daysOffset = n;
  }

  return {
    eventKey,
    daysOffset,
    emailEnabled,
    inAppEnabled,
    title,
    body,
    enabled,
    recipientIds,
  };
}

export async function createNotificationRule(fd: FormData) {
  const ctx = await requirePermission(MODULE, "CREATE");
  const parsed = parseRuleForm(fd);
  if ("error" in parsed) return { error: parsed.error };

  // 確認事件存在且為對應類型（時間型才能有 daysOffset）
  const template = await prisma.notificationEventTemplate.findUnique({
    where: { eventKey: parsed.eventKey },
    select: { eventType: true },
  });
  if (!template) return { error: "所選事件不存在" };
  if (template.eventType === "SCHEDULED" && parsed.daysOffset == null) {
    return { error: "時間型事件需填寫提前/延後天數" };
  }
  if (template.eventType === "EVENT" && parsed.daysOffset != null) {
    // 事件型強制清掉 daysOffset
    parsed.daysOffset = null;
  }

  try {
    const created = await prisma.notificationRule.create({
      data: {
        eventKey: parsed.eventKey,
        daysOffset: parsed.daysOffset,
        emailEnabled: parsed.emailEnabled,
        inAppEnabled: parsed.inAppEnabled,
        title: parsed.title,
        body: parsed.body,
        enabled: parsed.enabled,
        recipients: {
          create: parsed.recipientIds.map((userId) => ({ userId })),
        },
      },
    });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "CREATE",
      targetType: "NotificationRule",
      targetId: created.id,
      changes: {
        after: {
          eventKey: parsed.eventKey,
          channels: [parsed.emailEnabled && "email", parsed.inAppEnabled && "inApp"].filter(Boolean),
          recipientCount: parsed.recipientIds.length,
        },
      },
    });
    revalidatePath(PATH);
    return { ok: true as const, id: created.id };
  } catch (e) {
    console.error("[rule:create]", e);
    return { error: "建立失敗，請稍後再試" };
  }
}

export async function updateNotificationRule(id: string, fd: FormData) {
  const ctx = await requirePermission(MODULE, "EDIT");
  const parsed = parseRuleForm(fd);
  if ("error" in parsed) return { error: parsed.error };

  const template = await prisma.notificationEventTemplate.findUnique({
    where: { eventKey: parsed.eventKey },
    select: { eventType: true },
  });
  if (!template) return { error: "所選事件不存在" };
  if (template.eventType === "SCHEDULED" && parsed.daysOffset == null) {
    return { error: "時間型事件需填寫提前/延後天數" };
  }
  if (template.eventType === "EVENT") parsed.daysOffset = null;

  try {
    await prisma.$transaction([
      prisma.notificationRuleRecipient.deleteMany({ where: { ruleId: id } }),
      prisma.notificationRule.update({
        where: { id },
        data: {
          eventKey: parsed.eventKey,
          daysOffset: parsed.daysOffset,
          emailEnabled: parsed.emailEnabled,
          inAppEnabled: parsed.inAppEnabled,
          title: parsed.title,
          body: parsed.body,
          enabled: parsed.enabled,
          recipients: {
            create: parsed.recipientIds.map((userId) => ({ userId })),
          },
        },
      }),
    ]);
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "UPDATE",
      targetType: "NotificationRule",
      targetId: id,
    });
    revalidatePath(PATH);
    revalidatePath(`${PATH}/rules/${id}/edit`);
    return { ok: true as const };
  } catch (e) {
    console.error("[rule:update]", e);
    return { error: "更新失敗，請稍後再試" };
  }
}

// ─── 測試發送：依規則建立通知到所有 recipients ──────────────────────────────

/**
 * 立刻依指定規則建立系統內通知，方便驗證通知中心 UI。
 *
 * - 規則必須 enabled 且勾選 inAppEnabled
 * - 每個 recipient 建立一筆 Notification
 * - title / body 前綴「【測試】」以便辨識
 */
export async function sendTestNotification(ruleId: string) {
  const ctx = await requirePermission(MODULE, "EDIT");

  const rule = await prisma.notificationRule.findUnique({
    where: { id: ruleId },
    include: { recipients: { select: { userId: true } } },
  });
  if (!rule) return { error: "規則不存在" };
  if (!rule.enabled) return { error: "規則已停用，請先啟用" };
  if (!rule.inAppEnabled) {
    return { error: "此規則未勾選「系統內通知」通道，僅 Email 規則暫無法測試（尚未串接寄送）" };
  }
  if (rule.recipients.length === 0) return { error: "規則無收件人，無法發送" };

  try {
    await prisma.notification.createMany({
      data: rule.recipients.map((r) => ({
        userId: r.userId,
        ruleId: rule.id,
        title: `【測試】${rule.title}`,
        body: rule.body,
      })),
    });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "CREATE",
      targetType: "Notification",
      changes: { test: true, ruleId, recipientCount: rule.recipients.length },
    });
    revalidatePath(PATH);
    revalidatePath("/notifications");
    revalidatePath("/dashboard");
    return { ok: true as const, sentCount: rule.recipients.length };
  } catch (e) {
    console.error("[notification:test]", e);
    return { error: "測試發送失敗，請稍後再試" };
  }
}

export async function deleteNotificationRule(id: string) {
  const ctx = await requirePermission(MODULE, "DELETE");
  try {
    await prisma.notificationRule.delete({ where: { id } });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "DELETE",
      targetType: "NotificationRule",
      targetId: id,
    });
  } catch (e) {
    console.error("[rule:delete]", e);
    return { error: "刪除失敗，請稍後再試" };
  }
  revalidatePath(PATH);
  redirect(PATH);
}
