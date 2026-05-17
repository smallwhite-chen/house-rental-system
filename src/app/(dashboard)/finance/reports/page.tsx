import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import {
  aggregateByCategory,
  aggregateByMonth,
  buildPnlMonthly,
  buildTotalSummary,
  getPresetRange,
  type CategorizedAmount,
  type DatedAmount,
} from "@/lib/report-aggregator";
import { ReportsClient } from "./reports-client";

export const metadata: Metadata = {
  title: "財務報表 ｜ 房屋租賃管理系統",
};

type ReportTab = "income" | "expense" | "pnl";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    propertyId?: string;
    tab?: string;
  }>;
}) {
  await requirePermission("REPORTS", "VIEW");

  const sp = await searchParams;

  // 預設期間：本月（與 SPEC 預期一致）
  const defaultRange = getPresetRange("thisMonth");
  const from = sp.from ? new Date(sp.from + "T00:00:00") : defaultRange.from;
  const to = sp.to ? new Date(sp.to + "T23:59:59") : defaultRange.to;
  const propertyId = sp.propertyId && sp.propertyId !== "ALL" ? sp.propertyId : null;
  const tab: ReportTab = sp.tab === "expense" || sp.tab === "pnl" ? sp.tab : "income";

  // 全部房產供下拉
  const properties = await prisma.property.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // ── 收入：PaymentRecord（在期間內、且選定房產底下） ──
  const paymentRecords = await prisma.paymentRecord.findMany({
    where: {
      paymentDate: { gte: from, lte: to },
      ...(propertyId
        ? { invoice: { contract: { unit: { propertyId } } } }
        : {}),
    },
    select: { paymentDate: true, amount: true },
  });
  const incomeRows: DatedAmount[] = paymentRecords.map((p) => ({
    date: p.paymentDate,
    amount: Number(p.amount),
  }));

  // ── 支出：Expense（在期間內、且選定房產） ──
  const expenseRecords = await prisma.expense.findMany({
    where: {
      expenseDate: { gte: from, lte: to },
      ...(propertyId ? { propertyId } : {}),
    },
    select: {
      expenseDate: true,
      amount: true,
      expenseType: { select: { id: true, name: true } },
    },
  });
  const expenseRows: DatedAmount[] = expenseRecords.map((e) => ({
    date: e.expenseDate,
    amount: Number(e.amount),
  }));
  const expenseCategorized: CategorizedAmount[] = expenseRecords.map((e) => ({
    date: e.expenseDate,
    amount: Number(e.amount),
    categoryId: e.expenseType.id,
    categoryName: e.expenseType.name,
  }));

  // ── 聚合 ──
  const incomeMonthly = aggregateByMonth(incomeRows, from, to);
  const expenseMonthly = aggregateByMonth(expenseRows, from, to);
  const expenseByCategory = aggregateByCategory(expenseCategorized);
  const pnlMonthly = buildPnlMonthly(incomeMonthly, expenseMonthly);
  const summary = buildTotalSummary(incomeMonthly, expenseMonthly);

  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm print:hidden">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/finance" className="hover:text-on-surface hover:underline">租金管理</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">財務報表</li>
        </ol>
      </nav>

      <header className="space-y-1">
        <h1 className="text-3xl font-medium text-on-surface">財務報表</h1>
        <p className="text-sm text-on-surface-variant">
          期間：{fromStr} ~ {toStr}
          {propertyId && (
            <>
              <span className="mx-2">·</span>
              <span>
                {properties.find((p) => p.id === propertyId)?.name ?? "（未知房產）"}
              </span>
            </>
          )}
          {!propertyId && (
            <>
              <span className="mx-2">·</span>
              <span>全部房產</span>
            </>
          )}
        </p>
      </header>

      <ReportsClient
        currentTab={tab}
        currentFrom={fromStr}
        currentTo={toStr}
        currentPropertyId={propertyId ?? "ALL"}
        properties={properties}
        summary={summary}
        incomeMonthly={incomeMonthly}
        expenseMonthly={expenseMonthly}
        expenseByCategory={expenseByCategory}
        pnlMonthly={pnlMonthly}
        incomeCount={paymentRecords.length}
        expenseCount={expenseRecords.length}
      />
    </div>
  );
}
