import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const metadata: Metadata = {
  title: "系統設定 ｜ 房屋租賃管理系統",
};

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      title="系統設定"
      subtitle="公司基本資料、帳號、角色、通知、各種類資料管理、稽核紀錄"
      specSection="§3"
      plannedPhase="Phase 2.4 ~ 2.9"
    />
  );
}
