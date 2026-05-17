import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { ExpenseForm } from "../expense-form";
import { createExpense } from "../actions";

export const metadata: Metadata = {
  title: "新增支出 ｜ 房屋租賃管理系統",
};

export default async function NewExpensePage() {
  await requirePermission("EXPENSES", "CREATE");

  const [expenseTypes, properties, units] = await Promise.all([
    prisma.expenseType.findMany({ orderBy: { name: "asc" } }),
    prisma.property.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.unit.findMany({
      orderBy: [{ propertyId: "asc" }, { number: "asc" }],
      select: { id: true, number: true, propertyId: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/finance" className="hover:text-on-surface hover:underline">租金管理</Link></li>
          <li aria-hidden="true">›</li>
          <li><Link href="/finance/expenses" className="hover:text-on-surface hover:underline">支出管理</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">新增支出</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">新增支出</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          請選擇支出種類並指定關聯房產或房間
        </p>
      </header>

      <ExpenseForm
        expenseTypes={expenseTypes.map((t) => ({ id: t.id, name: t.name }))}
        properties={properties}
        units={units}
        submitLabel="建立支出"
        onSubmit={createExpense}
      />
    </div>
  );
}
