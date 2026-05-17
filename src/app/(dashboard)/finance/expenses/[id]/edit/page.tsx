import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { ExpenseForm } from "../../expense-form";
import { ExpenseDeleteButton } from "./expense-delete-button";
import { updateExpense, deleteExpense } from "../../actions";

export const metadata: Metadata = {
  title: "編輯支出 ｜ 房屋租賃管理系統",
};

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("EXPENSES", "EDIT");
  const canDelete = hasPermission(ctx, "EXPENSES", "DELETE");
  const { id } = await params;

  const [expense, expenseTypes, properties, units] = await Promise.all([
    prisma.expense.findUnique({
      where: { id },
      include: { expenseType: { select: { name: true } } },
    }),
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

  if (!expense) notFound();

  const updateForThis = updateExpense.bind(null, id);

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/finance" className="hover:text-on-surface hover:underline">租金管理</Link></li>
          <li aria-hidden="true">›</li>
          <li><Link href="/finance/expenses" className="hover:text-on-surface hover:underline">支出管理</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">編輯</li>
        </ol>
      </nav>

      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-medium text-on-surface">編輯支出</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {expense.expenseType.name} · {expense.expenseDate.toISOString().slice(0, 10)}
          </p>
        </div>
        {canDelete && (
          <ExpenseDeleteButton expenseId={id} deleteAction={deleteExpense} />
        )}
      </header>

      <ExpenseForm
        expenseTypes={expenseTypes.map((t) => ({ id: t.id, name: t.name }))}
        properties={properties}
        units={units}
        initial={{
          expenseTypeId: expense.expenseTypeId,
          expenseDate: expense.expenseDate.toISOString().slice(0, 10),
          amount: expense.amount.toString(),
          propertyId: expense.propertyId,
          level: expense.level,
          unitId: expense.unitId,
          receiptUrl: expense.receiptUrl,
          note: expense.note,
        }}
        submitLabel="儲存變更"
        onSubmit={updateForThis}
        nextPath="/finance/expenses"
      />
    </div>
  );
}
