import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { ExpensesClient } from "./expenses-client";

export const metadata: Metadata = {
  title: "支出管理 ｜ 房屋租賃管理系統",
};

export default async function ExpensesPage() {
  const ctx = await requirePermission("EXPENSES", "VIEW");
  const canCreate = hasPermission(ctx, "EXPENSES", "CREATE");

  const [expenses, properties, units, expenseTypes] = await Promise.all([
    prisma.expense.findMany({
      orderBy: [{ expenseDate: "desc" }],
      include: {
        expenseType: { select: { name: true } },
        property: { select: { name: true } },
        unit: { select: { number: true } },
      },
    }),
    prisma.property.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.unit.findMany({
      orderBy: [{ propertyId: "asc" }, { number: "asc" }],
      select: { id: true, number: true, propertyId: true },
    }),
    prisma.expenseType.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const rows = expenses.map((e) => ({
    id: e.id,
    expenseDate: e.expenseDate.toISOString().slice(0, 10),
    typeName: e.expenseType.name,
    typeId: e.expenseTypeId,
    amount: Number(e.amount),
    level: e.level,
    propertyId: e.propertyId,
    propertyName: e.property.name,
    unitId: e.unitId,
    unitNumber: e.unit?.number ?? null,
    receiptUrl: e.receiptUrl,
    note: e.note,
  }));

  return (
    <ExpensesClient
      expenses={rows}
      properties={properties}
      units={units}
      expenseTypes={expenseTypes}
      canCreate={canCreate}
    />
  );
}
