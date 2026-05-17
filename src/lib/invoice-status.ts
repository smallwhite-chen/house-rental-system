/**
 * 帳單收款狀態計算（SPEC §7.1）。
 *
 * 規則（依累計實收 / 應收 / 應繳日 / 現在時間綜合判斷）：
 * - 累計實收 = 0、且未過應繳日 → UNPAID（未收款）
 * - 累計實收 = 0、且已過應繳日 → OVERDUE（逾期）
 * - 0 < 累計實收 < 應收 → PARTIAL（部分收款）
 * - 累計實收 = 應收     → PAID（已收款）
 * - 累計實收 > 應收     → OVERPAID（已收款溢收）
 *
 * 注意：PARTIAL 即使超過應繳日，依規格仍歸 PARTIAL，不再退回 OVERDUE
 *      （因為房客已開始付款；逾期主要表達「完全沒收到錢」的警示）。
 */
import type { InvoiceStatus } from "@/generated/prisma/client";

export function computeInvoiceStatus(
  totalDue: number,
  totalPaid: number,
  dueDate: Date,
  now: Date = new Date()
): InvoiceStatus {
  if (totalPaid === 0) {
    return dueDate < now ? "OVERDUE" : "UNPAID";
  }
  if (totalPaid > totalDue) return "OVERPAID";
  if (totalPaid >= totalDue) return "PAID";
  return "PARTIAL";
}

/** UI label + tone（對應 globals.css 的 status-* 色 token）。 */
export const INVOICE_STATUS_META: Record<
  InvoiceStatus,
  { label: string; tone: "rented" | "overdue" | "vacant" | "maintenance" | "completed" }
> = {
  UNPAID: { label: "未收款", tone: "vacant" },
  PARTIAL: { label: "部分收款", tone: "maintenance" },
  PAID: { label: "已收款", tone: "rented" },
  OVERPAID: { label: "已收款（溢收）", tone: "completed" },
  OVERDUE: { label: "逾期", tone: "overdue" },
};

/**
 * 帳單金額計算：依度數 × 單價 + 租金 + 管理費 → 應收總額。
 *
 * 度數為 null（管理者尚未填入）時，對應水/電金額一律視為 0（不阻擋帳單存在）。
 */
export type InvoiceAmounts = {
  rentAmount: number;
  managementFee: number;
  waterUnitPrice: number;
  electricityUnitPrice: number;
  waterMeterReading: number | null;
  electricityMeterReading: number | null;
};

export function computeInvoiceAmounts(input: InvoiceAmounts): {
  waterAmount: number;
  electricityAmount: number;
  totalAmount: number;
} {
  const waterAmount =
    input.waterMeterReading != null ? round2(input.waterMeterReading * input.waterUnitPrice) : 0;
  const electricityAmount =
    input.electricityMeterReading != null
      ? round2(input.electricityMeterReading * input.electricityUnitPrice)
      : 0;
  const totalAmount = round2(
    input.rentAmount + input.managementFee + waterAmount + electricityAmount
  );
  return { waterAmount, electricityAmount, totalAmount };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * 計算下次收租日。
 *
 * 規格 §8 帳單自動產生：收租日前 7 天產生帳單。
 * 此 helper 用於「手動產生帳單」時推算 billingPeriodStart / billingPeriodEnd / dueDate。
 *
 * 邏輯：取「下一個還沒到的 dueDay」作為應繳日；
 *      billingPeriodEnd = dueDate - 1 天；
 *      billingPeriodStart = 上一期 dueDate（dueDate 往前 1 個月 + 1 天）。
 */
export function computeNextBillingPeriod(
  rentDueDay: number,
  now: Date = new Date()
): { billingPeriodStart: Date; billingPeriodEnd: Date; dueDate: Date } {
  const year = now.getFullYear();
  const month = now.getMonth();
  let dueDate = clampDay(year, month, rentDueDay);
  if (dueDate <= now) {
    // 本月的 dueDay 已過，跳下個月
    dueDate = clampDay(year, month + 1, rentDueDay);
  }
  // billingPeriodEnd 為應繳日當天
  const billingPeriodEnd = new Date(dueDate);
  // billingPeriodStart 為上一個月的 dueDay + 1 天
  const prev = clampDay(dueDate.getFullYear(), dueDate.getMonth() - 1, rentDueDay);
  const billingPeriodStart = new Date(prev);
  billingPeriodStart.setDate(billingPeriodStart.getDate() + 1);
  return { billingPeriodStart, billingPeriodEnd, dueDate };
}

/** 取得 (year, month, day) 對應日期；若該月沒有此 day（如 2/31）則 clamp 至當月最後一天。 */
function clampDay(year: number, month: number, day: number): Date {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDayOfMonth));
}
