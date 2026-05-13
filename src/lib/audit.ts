/**
 * 稽核紀錄 helper（SPEC §3.11）。
 *
 * 設計原則：
 * - 寫稽核紀錄絕不能擋住業務流程：所有錯誤 swallow 並只印到 server console。
 * - 紀錄保存 3 個月，由 cleanupOldAuditLogs() 定期清除（Vercel Cron @ Phase 8）。
 * - 由 Server Action / NextAuth events 主動呼叫，不做隱式攔截以避免漏記或誤記。
 */
import { prisma } from "@/lib/prisma";
import type { AuditAction, ModuleKey, Prisma } from "@/generated/prisma/client";

export type LogAuditInput = {
  /** 操作者 user id；登入失敗等情境可能為 null。 */
  userId?: string | null;
  /** 此操作屬於哪個系統模組（對應 sidebar 項目）。 */
  module?: ModuleKey;
  /** 操作類型。 */
  action: AuditAction;
  /** 被操作的資料類型，例如 "Property" / "Contract"。 */
  targetType?: string;
  /** 被操作的資料 id。 */
  targetId?: string;
  /** 變更前後內容；建議格式 `{ before: {...}, after: {...} }`。 */
  changes?: Prisma.InputJsonValue;
  /** 來源 IP；Server Action 中可從 headers() 取得。 */
  ipAddress?: string;
};

export async function logAudit(input: LogAuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        module: input.module ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        changes: input.changes ?? undefined,
        ipAddress: input.ipAddress ?? null,
      },
    });
  } catch (err) {
    // 稽核失敗不應擋住業務；只記錄到 server log 供 ops 排查
    console.error("[audit] failed to write log:", err, "input:", input);
  }
}

/**
 * 刪除 3 個月以前的稽核紀錄（SPEC §3.11「紀錄保存期限：僅保留最近 3 個月」）。
 *
 * 回傳實際刪除筆數。Phase 8 會由 Vercel Cron 每日呼叫。
 */
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export async function cleanupOldAuditLogs(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION_MS);
  const result = await prisma.auditLog.deleteMany({
    where: { timestamp: { lt: cutoff } },
  });
  return result.count;
}
