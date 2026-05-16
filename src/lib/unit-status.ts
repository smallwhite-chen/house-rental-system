/**
 * 房間出租狀態自動計算（SPEC §4.4）。
 *
 * 規則：
 * - 管理者手動設定 `manualStatus = MAINTENANCE`：直接視為「整修中」（最優先）
 * - 否則依合約推算：
 *   - 有「有效」合約（startDate <= now <= endDate，且 contract.manualStatus 非 TERMINATED/COMPLETED）→ 出租中
 *   - 合約已過期但尚未退租（endDate < now，contract.manualStatus 非 TERMINATED/COMPLETED）→ 合約逾期
 *   - 否則 → 空置
 *
 * 注意：Unit.manualStatus 在 schema 中其實允許四種值（VACANT/RENTED/OVERDUE/MAINTENANCE），
 * 但依 SPEC 只有 MAINTENANCE 是「人為手動」的；其他三種都是系統自動推算。
 */
import type { ContractStatus, UnitStatus } from "@/generated/prisma/client";

export type ContractForStatus = {
  startDate: Date;
  endDate: Date;
  manualStatus: ContractStatus | null;
};

export type UnitForStatus = {
  manualStatus: UnitStatus | null;
  contracts: ContractForStatus[];
};

/**
 * 計算房間目前的出租狀態。
 *
 * @param unit 房間資料，需包含 manualStatus 與該房間的所有合約
 * @param now 計算用的「現在時間」，預設為當前時間；測試時可注入特定時間
 */
export function computeUnitStatus(
  unit: UnitForStatus,
  now: Date = new Date()
): UnitStatus {
  // 1. 手動覆寫優先（僅 MAINTENANCE 有效，其他理論上不會發生）
  if (unit.manualStatus === "MAINTENANCE") return "MAINTENANCE";

  // 2. 找「未被手動終結」的合約
  const liveContracts = unit.contracts.filter(
    (c) => c.manualStatus !== "TERMINATED" && c.manualStatus !== "COMPLETED"
  );

  // 3. 是否存在有效期間內的合約
  const hasActive = liveContracts.some(
    (c) => c.startDate <= now && now <= c.endDate
  );
  if (hasActive) return "RENTED";

  // 4. 是否有已過期但尚未終結的合約 → 合約逾期
  const hasOverdue = liveContracts.some((c) => c.endDate < now);
  if (hasOverdue) return "OVERDUE";

  // 5. 其餘狀況一律視為空置
  return "VACANT";
}

/**
 * 一個房產內所有房間的狀態統計。
 * 用於房產列表卡片顯示。
 */
export type UnitStatusCounts = {
  total: number;
  rented: number;
  vacant: number;
  overdue: number;
  maintenance: number;
};

export function summarizeUnitStatuses(
  units: UnitForStatus[],
  now: Date = new Date()
): UnitStatusCounts {
  const counts: UnitStatusCounts = {
    total: units.length,
    rented: 0,
    vacant: 0,
    overdue: 0,
    maintenance: 0,
  };
  for (const u of units) {
    const status = computeUnitStatus(u, now);
    if (status === "RENTED") counts.rented++;
    else if (status === "VACANT") counts.vacant++;
    else if (status === "OVERDUE") counts.overdue++;
    else if (status === "MAINTENANCE") counts.maintenance++;
  }
  return counts;
}

/**
 * UI 顯示用：狀態 → 中文標籤與 tone（對應 status- 色 token）。
 */
export const UNIT_STATUS_META: Record<
  UnitStatus,
  { label: string; tone: "rented" | "overdue" | "maintenance" | "vacant" }
> = {
  RENTED: { label: "出租中", tone: "rented" },
  OVERDUE: { label: "合約逾期", tone: "overdue" },
  MAINTENANCE: { label: "整修中", tone: "maintenance" },
  VACANT: { label: "空置", tone: "vacant" },
};
