import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const metadata: Metadata = {
  title: "租金管理 ｜ 房屋租賃管理系統",
};

export default function FinancePage() {
  return (
    <ModulePlaceholder
      title="租金管理"
      subtitle="帳單、收款紀錄、支出、財務報表"
      specSection="§7"
      plannedPhase="Phase 6"
    />
  );
}
