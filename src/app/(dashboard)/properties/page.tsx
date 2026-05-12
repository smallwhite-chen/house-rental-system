import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const metadata: Metadata = {
  title: "房產管理 ｜ 房屋租賃管理系統",
};

export default function PropertiesPage() {
  return (
    <ModulePlaceholder
      title="房產管理"
      subtitle="管理公司旗下房產與房間清單"
      specSection="§4"
      plannedPhase="Phase 3"
    />
  );
}
