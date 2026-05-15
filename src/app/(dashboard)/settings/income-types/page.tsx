import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { TypeCrudClient } from "@/components/ui/TypeCrudClient";
import { createIncomeType, updateIncomeType, deleteIncomeType } from "./actions";

export const metadata: Metadata = {
  title: "收入種類管理 ｜ 房屋租賃管理系統",
};

export default async function IncomeTypesPage() {
  await requirePermission("SETTINGS_INCOME_TYPES", "VIEW");
  const items = await prisma.incomeType.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <TypeCrudClient
      moduleName="收入種類"
      items={items}
      createAction={createIncomeType}
      updateAction={updateIncomeType}
      deleteAction={deleteIncomeType}
    />
  );
}
