/**
 * 溝通紀錄處理狀態的 UI 對映（SPEC §8.2）。
 *
 * 三個狀態對應的標籤與配色：
 *   PENDING     待處理（紅／overdue tone）
 *   IN_PROGRESS 處理中（黃／maintenance tone）
 *   COMPLETED   已完成（綠／rented tone）
 */
import type { CommunicationStatus } from "@/generated/prisma/client";
import type { StatusTone } from "@/components/ui/StatusChip";

export const COMMUNICATION_STATUS_META: Record<
  CommunicationStatus,
  { label: string; tone: StatusTone }
> = {
  PENDING: { label: "待處理", tone: "overdue" },
  IN_PROGRESS: { label: "處理中", tone: "maintenance" },
  COMPLETED: { label: "已完成", tone: "rented" },
};

export const COMMUNICATION_STATUS_OPTIONS: ReadonlyArray<{
  value: CommunicationStatus;
  label: string;
}> = [
  { value: "PENDING", label: "待處理" },
  { value: "IN_PROGRESS", label: "處理中" },
  { value: "COMPLETED", label: "已完成" },
];
