import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { TypeCrudClient } from "@/components/ui/TypeCrudClient";
import { createExpenseType, updateExpenseType, deleteExpenseType } from "./actions";

export const metadata: Metadata = {
  title: "支出種類管理 ｜ 房屋租賃管理系統",
};

export default async function ExpenseTypesPage() {
  await requirePermission("SETTINGS_EXPENSE_TYPES", "VIEW");
  const items = await prisma.expenseType.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <TypeCrudClient
      moduleName="支出種類"
      items={items}
      createAction={createExpenseType}
      updateAction={updateExpenseType}
      deleteAction={deleteExpenseType}
    />
  );
}
