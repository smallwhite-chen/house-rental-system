import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const metadata: Metadata = {
  title: "房客管理 ｜ 房屋租賃管理系統",
};

export default function TenantsPage() {
  return (
    <ModulePlaceholder
      title="房客管理"
      subtitle="管理房客基本資料與合約歷史"
      specSection="§5"
      plannedPhase="Phase 4"
    />
  );
}
