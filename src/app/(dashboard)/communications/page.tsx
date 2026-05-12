import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const metadata: Metadata = {
  title: "溝通與維修 ｜ 房屋租賃管理系統",
};

export default function CommunicationsPage() {
  return (
    <ModulePlaceholder
      title="溝通與維修"
      subtitle="與房客的溝通紀錄、維修事項、標籤管理"
      specSection="§8"
      plannedPhase="Phase 7"
    />
  );
}
