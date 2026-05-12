import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const metadata: Metadata = {
  title: "合約管理 ｜ 房屋租賃管理系統",
};

export default function ContractsPage() {
  return (
    <ModulePlaceholder
      title="合約管理"
      subtitle="管理租賃合約、租金條件、設備清單"
      specSection="§6"
      plannedPhase="Phase 5"
    />
  );
}
