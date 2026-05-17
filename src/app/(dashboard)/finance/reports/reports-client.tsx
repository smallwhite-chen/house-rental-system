"use client";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SelectChevron } from "@/components/ui/Select";
import type {
  CategoryPoint,
  MonthlyPoint,
  PnlMonthlyPoint,
  TotalSummary,
} from "@/lib/report-aggregator";
import { IncomeReport } from "./income-report";
import { ExpenseReport } from "./expense-report";
import { PnlReport } from "./pnl-report";

type ReportTab = "income" | "expense" | "pnl";

type Props = {
  currentTab: ReportTab;
  currentFrom: string;
  currentTo: string;
  currentPropertyId: string; // "ALL" 或 propertyId
  properties: { id: string; name: string }[];
  summary: TotalSummary;
  incomeMonthly: MonthlyPoint[];
  expenseMonthly: MonthlyPoint[];
  expenseByCategory: CategoryPoint[];
  pnlMonthly: PnlMonthlyPoint[];
  incomeCount: number;
  expenseCount: number;
};

const TABS: Array<{ key: ReportTab; label: string; icon: string }> = [
  { key: "income", label: "收入報表", icon: "📈" },
  { key: "expense", label: "支出報表", icon: "📉" },
  { key: "pnl", label: "損益報表", icon: "💰" },
];

const PRESETS: Array<{ key: string; label: string }> = [
  { key: "thisMonth", label: "本月" },
  { key: "thisQuarter", label: "本季" },
  { key: "thisYear", label: "本年" },
  { key: "lastYear", label: "去年" },
];

export function ReportsClient({
  currentTab,
  currentFrom,
  currentTo,
  currentPropertyId,
  properties,
  summary,
  incomeMonthly,
  expenseMonthly,
  expenseByCategory,
  pnlMonthly,
  incomeCount,
  expenseCount,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function buildUrl(updates: { tab?: string; from?: string; to?: string; propertyId?: string }) {
    const params = new URLSearchParams();
    const tab = updates.tab ?? currentTab;
    const from = updates.from ?? currentFrom;
    const to = updates.to ?? currentTo;
    const propertyId = updates.propertyId ?? currentPropertyId;
    if (tab !== "income") params.set("tab", tab);
    params.set("from", from);
    params.set("to", to);
    if (propertyId && propertyId !== "ALL") params.set("propertyId", propertyId);
    return `${pathname}?${params.toString()}`;
  }

  function go(updates: Parameters<typeof buildUrl>[0]) {
    router.push(buildUrl(updates));
  }

  function applyPreset(preset: string) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    let from: Date, to: Date;
    if (preset === "thisMonth") {
      from = new Date(y, m, 1);
      to = new Date(y, m + 1, 0);
    } else if (preset === "thisQuarter") {
      const qStart = Math.floor(m / 3) * 3;
      from = new Date(y, qStart, 1);
      to = new Date(y, qStart + 3, 0);
    } else if (preset === "thisYear") {
      from = new Date(y, 0, 1);
      to = new Date(y, 11, 31);
    } else {
      from = new Date(y - 1, 0, 1);
      to = new Date(y - 1, 11, 31);
    }
    go({ from: ymd(from), to: ymd(to) });
  }

  return (
    <div className="space-y-6">
      {/* ── 篩選列（列印時隱藏） ── */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-surface p-4 ring-1 ring-outline-variant print:hidden">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-on-surface-variant">起始日期</label>
          <input
            type="date"
            value={currentFrom}
            onChange={(e) => go({ from: e.target.value })}
            className="rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface ring-1 ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-on-surface-variant">結束日期</label>
          <input
            type="date"
            value={currentTo}
            onChange={(e) => go({ to: e.target.value })}
            className="rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface ring-1 ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-on-surface-variant">房產</label>
          <div className="relative">
            <select
              value={currentPropertyId}
              onChange={(e) => go({ propertyId: e.target.value })}
              className="block w-full appearance-none rounded-lg bg-surface-container-high pl-3 pr-9 py-2 text-sm text-on-surface ring-1 ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">全部房產</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-on-surface-variant">快速期間</label>
          <div className="flex flex-wrap gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                className="rounded-full bg-surface-container-high px-3 py-2 text-xs font-medium text-on-surface-variant hover:bg-surface-container"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto self-end">
          <Button variant="outlined" onClick={() => window.print()} leadingIcon={<PrintIcon />}>
            匯出 PDF
          </Button>
        </div>
      </div>

      {/* ── 總計卡片 ── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="總收入" value={summary.totalIncome} tone="bg-status-rented/12 text-status-rented" />
        <SummaryCard label="總支出" value={summary.totalExpense} tone="bg-status-overdue/12 text-status-overdue" />
        <SummaryCard
          label="淨收益"
          value={summary.net}
          tone={
            summary.net >= 0
              ? "bg-status-completed/12 text-status-completed"
              : "bg-status-overdue/12 text-status-overdue"
          }
        />
        <SummaryCard
          label="利潤率"
          value={summary.marginRatio}
          format="percent"
          tone="bg-surface-container-high text-on-surface"
        />
      </div>

      {/* ── 報表 Tabs ── */}
      <div className="flex flex-wrap gap-1 rounded-full bg-surface-container-high p-1 w-fit print:hidden">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => go({ tab: t.key })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              currentTab === t.key
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span className="mr-1">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab 內容 ── */}
      {currentTab === "income" && (
        <IncomeReport monthly={incomeMonthly} totalCount={incomeCount} totalAmount={summary.totalIncome} />
      )}
      {currentTab === "expense" && (
        <ExpenseReport
          monthly={expenseMonthly}
          byCategory={expenseByCategory}
          totalCount={expenseCount}
          totalAmount={summary.totalExpense}
        />
      )}
      {currentTab === "pnl" && <PnlReport monthly={pnlMonthly} />}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  format = "currency",
}: {
  label: string;
  value: number;
  tone: string;
  format?: "currency" | "percent";
}) {
  const display =
    format === "percent"
      ? `${(value * 100).toFixed(1)}%`
      : `NT$ ${value.toLocaleString("zh-TW", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  return (
    <div className={`rounded-2xl p-5 ring-1 ring-outline-variant ${tone}`}>
      <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-3xl font-medium">{display}</p>
    </div>
  );
}

function ymd(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function PrintIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path fillRule="evenodd" d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.752.097 1.126.153A2.212 2.212 0 0 1 18 8.653v4.097A2.25 2.25 0 0 1 15.75 15h-.241l.305 1.984A1.75 1.75 0 0 1 14.084 19H5.915a1.75 1.75 0 0 1-1.73-2.016L4.492 15H4.25A2.25 2.25 0 0 1 2 12.75V8.653c0-1.082.775-2.034 1.874-2.198.374-.056.75-.107 1.127-.153V2.75Zm8.5 3.397a41.533 41.533 0 0 0-7 0V2.75a.25.25 0 0 1 .25-.25h6.5a.25.25 0 0 1 .25.25v3.397ZM6.608 12.5a.25.25 0 0 0-.247.213l-.693 4.5a.25.25 0 0 0 .247.287h8.17a.25.25 0 0 0 .247-.287l-.692-4.5a.25.25 0 0 0-.247-.213H6.608Z" clipRule="evenodd" />
    </svg>
  );
}
