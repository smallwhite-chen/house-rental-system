import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/rbac";

export const metadata: Metadata = {
  title: "租金管理 ｜ 房屋租賃管理系統",
};

/**
 * 租金管理 hub 頁。
 *
 * 顯示 4 個子模組卡片：帳單、收款、報表、支出。
 * 已上線的可點進去，未上線的灰掉並標記 phase。
 */
export default async function FinanceHubPage() {
  await requireUserContext();

  // 簡單統計：未收款 / 逾期帳單數量，方便管理者一眼看到優先事項
  const [unpaid, overdue, partial] = await Promise.all([
    prisma.invoice.count({ where: { status: "UNPAID" } }),
    prisma.invoice.count({ where: { status: "OVERDUE" } }),
    prisma.invoice.count({ where: { status: "PARTIAL" } }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-medium text-on-surface">租金管理</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          帳單、收款紀錄、支出、財務報表
        </p>
      </header>

      {(unpaid > 0 || overdue > 0 || partial > 0) && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="未收款" count={unpaid} tone="bg-status-vacant/15 text-status-vacant" />
          <Stat label="部分收款" count={partial} tone="bg-status-maintenance/15 text-status-maintenance" />
          <Stat label="逾期" count={overdue} tone="bg-status-overdue/12 text-status-overdue" />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          title="帳單管理"
          description="檢視、編輯、刪除帳單。可從合約頁建立新帳單。"
          href="/finance/invoices"
          phase="Phase 6a"
          available
          icon={<InvoiceIcon />}
        />
        <Card
          title="收款紀錄"
          description="所有收款紀錄一覽（透過帳單詳細頁進入）。"
          href="/finance/invoices"
          phase="Phase 6a"
          available
          icon={<MoneyIcon />}
        />
        <Card
          title="支出管理"
          description="登錄房產／房間層級的支出紀錄，支援多重篩選。"
          href="/finance/expenses"
          phase="Phase 6b"
          available
          icon={<ExpenseIcon />}
        />
        <Card
          title="財務報表"
          description="收入、支出、損益報表（含圖表）。"
          href="/finance/reports"
          phase="Phase 6c"
          available
          icon={<ChartIcon />}
        />
      </div>
    </div>
  );
}

function Stat({ label, count, tone }: { label: string; count: number; tone: string }) {
  return (
    <div className={`rounded-2xl p-4 ring-1 ring-outline-variant ${tone}`}>
      <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-3xl font-medium">{count}</p>
    </div>
  );
}

function Card({
  title,
  description,
  href,
  phase,
  available,
  icon,
}: {
  title: string;
  description: string;
  href: string | null;
  phase: string;
  available: boolean;
  icon: ReactNode;
}) {
  const inner = (
    <>
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            available
              ? "bg-primary-container text-on-primary-container"
              : "bg-surface-container-high text-on-surface-variant"
          }`}
        >
          {icon}
        </div>
        <p className="font-medium text-on-surface">{title}</p>
      </div>
      <p className="mt-3 text-sm text-on-surface-variant">{description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            available
              ? "bg-status-rented/12 text-status-rented"
              : "bg-surface-container-high text-on-surface-variant"
          }`}
        >
          {available ? "可使用" : "待開發"}
        </span>
        <span className="font-mono text-xs text-on-surface-variant">{phase}</span>
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl bg-surface p-5 ring-1 ring-outline-variant transition-all hover:shadow-md hover:ring-primary/40"
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className="rounded-2xl bg-surface/60 p-5 ring-1 ring-outline-variant opacity-60">
      {inner}
    </div>
  );
}

function InvoiceIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
      <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
    </svg>
  );
}

function MoneyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.094a4.001 4.001 0 0 0-.78 7.633L11.25 14v3.473a2.501 2.501 0 0 1-1.476-1.601.75.75 0 0 0-1.426.473 4.002 4.002 0 0 0 2.902 2.677V19.5a.75.75 0 0 0 1.5 0v-.477a4.001 4.001 0 0 0 .78-7.634L12.75 10V6.527a2.5 2.5 0 0 1 1.476 1.6.75.75 0 1 0 1.425-.473A4.002 4.002 0 0 0 12.75 6.094V6Z" clipRule="evenodd" />
    </svg>
  );
}

function ExpenseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path fillRule="evenodd" d="M2.25 2.25a.75.75 0 0 0 0 1.5H3v10.5a3 3 0 0 0 3 3h1.21l-1.172 3.513a.75.75 0 0 0 1.424.474l.329-.987h8.418l.33.987a.75.75 0 0 0 1.422-.474l-1.17-3.513H18a3 3 0 0 0 3-3V3.75h.75a.75.75 0 0 0 0-1.5H2.25Zm6.04 16.5.5-1.5h6.42l.5 1.5H8.29Zm7.46-12a.75.75 0 0 0-1.5 0v6a.75.75 0 0 0 1.5 0v-6Zm-3 2.25a.75.75 0 0 0-1.5 0v3.75a.75.75 0 0 0 1.5 0V9Zm-3 2.25a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0v-1.5Z" clipRule="evenodd" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
    </svg>
  );
}
