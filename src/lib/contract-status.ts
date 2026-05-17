/**
 * 合約狀態自動計算（SPEC §6.2）。
 *
 * 規則（優先序由上而下）：
 * - 若 manualStatus = TERMINATED 或 COMPLETED → 直接回該狀態（管理者手動覆寫優先）
 * - 否則依時間自動推算：
 *   - startDate <= now <= endDate → ACTIVE（進行中）
 *   - endDate < now              → EXPIRED（已到期）
 *   - now < startDate            → ACTIVE（尚未開始也算進行中，因為合約已簽訂）
 *     〔備註：規格未明確定義「未來生效」狀態；統一視為進行中以避免額外列舉〕
 */
import type { ContractStatus } from "@/generated/prisma/client";

export type ContractForStatusInput = {
  startDate: Date;
  endDate: Date;
  manualStatus: ContractStatus | null;
};

export function computeContractStatus(
  contract: ContractForStatusInput,
  now: Date = new Date()
): ContractStatus {
  if (contract.manualStatus === "TERMINATED") return "TERMINATED";
  if (contract.manualStatus === "COMPLETED") return "COMPLETED";
  if (contract.endDate < now) return "EXPIRED";
  return "ACTIVE";
}

/** UI label + tone（對應 globals.css 的 status-* 色 token）。 */
export const CONTRACT_STATUS_META: Record<
  ContractStatus,
  { label: string; tone: "rented" | "overdue" | "vacant" | "completed" }
> = {
  ACTIVE: { label: "進行中", tone: "rented" },
  EXPIRED: { label: "已到期", tone: "overdue" },
  TERMINATED: { label: "已終止", tone: "vacant" },
  COMPLETED: { label: "已完成", tone: "completed" },
};

/**
 * 檢查兩個合約是否有時間區段重疊。
 * 重疊定義：兩段區間 [a.start, a.end] 與 [b.start, b.end] 有交集。
 * （半開區間語義太複雜；採用簡單包含式比較即可滿足規格需求）
 */
export function contractsOverlap(
  a: { startDate: Date; endDate: Date },
  b: { startDate: Date; endDate: Date }
): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}
