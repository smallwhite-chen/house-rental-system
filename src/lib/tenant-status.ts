/**
 * 房客租住狀態自動計算（SPEC §5.2）。
 *
 * 規則（優先序由上而下）：
 * - RENTED（出租中）：至少有一份「有效」合約
 *     startDate <= now <= endDate，且 manualStatus 非 TERMINATED/COMPLETED
 * - OVERDUE（合約逾期）：至少有一份合約超過 endDate、尚未被手動終結
 *     endDate < now，且 manualStatus 非 TERMINATED/COMPLETED
 * - FORMER（已退租）：所有合約都被手動終結，或從未有過合約
 */
import type { ContractStatus } from "@/generated/prisma/client";

export type TenantStatus = "RENTED" | "OVERDUE" | "FORMER";

export type ContractForTenantStatus = {
  startDate: Date;
  endDate: Date;
  manualStatus: ContractStatus | null;
  unit?: { number: string; property?: { name: string } | null } | null;
};

export function computeTenantStatus(
  contracts: ContractForTenantStatus[],
  now: Date = new Date()
): TenantStatus {
  const live = contracts.filter(
    (c) => c.manualStatus !== "TERMINATED" && c.manualStatus !== "COMPLETED"
  );
  if (live.some((c) => c.startDate <= now && now <= c.endDate)) return "RENTED";
  if (live.some((c) => c.endDate < now)) return "OVERDUE";
  return "FORMER";
}

/** 取得房客目前居住的房間（取第一份「有效」合約對應的 Unit）。 */
export function getCurrentUnit(
  contracts: ContractForTenantStatus[],
  now: Date = new Date()
): { number: string; propertyName: string } | null {
  const active = contracts.find(
    (c) =>
      c.manualStatus !== "TERMINATED" &&
      c.manualStatus !== "COMPLETED" &&
      c.startDate <= now &&
      now <= c.endDate
  );
  if (!active?.unit) return null;
  return {
    number: active.unit.number,
    propertyName: active.unit.property?.name ?? "",
  };
}

/** UI label / tone（對應 status- 色 token）。 */
export const TENANT_STATUS_META: Record<
  TenantStatus,
  { label: string; tone: "rented" | "overdue" | "vacant" }
> = {
  RENTED: { label: "出租中", tone: "rented" },
  OVERDUE: { label: "合約逾期", tone: "overdue" },
  FORMER: { label: "已退租", tone: "vacant" },
};
