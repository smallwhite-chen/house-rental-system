"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusChip } from "@/components/ui/StatusChip";
import { SelectChevron } from "@/components/ui/Select";
import { INVOICE_STATUS_META } from "@/lib/invoice-status";
import type { InvoiceStatus } from "@/generated/prisma/client";

type InvoiceRow = {
  id: string;
  propertyId: string;
  propertyName: string;
  unitNumber: string;
  tenantName: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  totalAmount: number;
  totalPaid: number;
  status: InvoiceStatus;
};

type PropertyOption = { id: string; name: string };

// OVERPAID 視為 PAID 一類，合併在「已收款」分頁，因此 Filter 不再列 OVERPAID
type Filter = "ALL" | "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";

const FILTER_TABS: Array<{ key: Filter; label: string }> = [
  { key: "ALL", label: "全部" },
  { key: "UNPAID", label: "未收款" },
  { key: "PARTIAL", label: "部分收款" },
  { key: "PAID", label: "已收款" },
  { key: "OVERDUE", label: "逾期" },
];

export function InvoicesClient({
  invoices,
  properties,
}: {
  invoices: InvoiceRow[];
  properties: PropertyOption[];
}) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [propertyId, setPropertyId] = useState<string>("ALL");
  const [query, setQuery] = useState("");

  const propertyScoped = useMemo(
    () => (propertyId === "ALL" ? invoices : invoices.filter((c) => c.propertyId === propertyId)),
    [invoices, propertyId]
  );

  const filtered = useMemo(() => {
    return propertyScoped.filter((inv) => {
      // OVERPAID 合併在「已收款」分頁顯示
      if (filter !== "ALL") {
        if (filter === "PAID") {
          if (inv.status !== "PAID" && inv.status !== "OVERPAID") return false;
        } else if (inv.status !== filter) return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        return (
          inv.unitNumber.toLowerCase().includes(q) ||
          inv.tenantName.toLowerCase().includes(q) ||
          inv.propertyName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [propertyScoped, filter, query]);

  const counts = useMemo(() => ({
    ALL: propertyScoped.length,
    UNPAID: propertyScoped.filter((c) => c.status === "UNPAID").length,
    PARTIAL: propertyScoped.filter((c) => c.status === "PARTIAL").length,
    PAID: propertyScoped.filter((c) => c.status === "PAID" || c.status === "OVERPAID").length,
    OVERDUE: propertyScoped.filter((c) => c.status === "OVERDUE").length,
  }), [propertyScoped]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-medium text-on-surface">帳單管理</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            共 {invoices.length} 張帳單（顯示 {filtered.length}）
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋房間、房客或房產…"
            className="block w-full rounded-full border-0 bg-surface px-5 py-2.5 text-sm text-on-surface ring-1 ring-inset ring-outline placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          />
        </div>
        <div className="relative">
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            aria-label="依房產篩選"
            className="appearance-none rounded-full border-0 bg-surface pl-5 pr-10 py-2.5 text-sm text-on-surface ring-1 ring-inset ring-outline focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          >
            <option value="ALL">所有房產（{invoices.length}）</option>
            {properties.map((p) => {
              const count = invoices.filter((c) => c.propertyId === p.id).length;
              return (
                <option key={p.id} value={p.id}>
                  {p.name}（{count}）
                </option>
              );
            })}
          </select>
          <SelectChevron />
        </div>
        <div className="flex flex-wrap gap-1 rounded-full bg-surface-container-high p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === tab.key
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-70">{counts[tab.key]}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-surface py-16 text-center text-sm text-on-surface-variant ring-1 ring-outline-variant">
          {invoices.length === 0
            ? "尚無帳單。請至合約詳細頁點「產生本期帳單」建立。"
            : "此篩選條件下無帳單。"}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-outline-variant">
          <table className="w-full">
            <thead className="bg-surface-container-high text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-6 py-3">房間</th>
                <th className="px-6 py-3">房客</th>
                <th className="px-6 py-3">帳單期間</th>
                <th className="px-6 py-3">應繳日</th>
                <th className="px-6 py-3 text-right">應收</th>
                <th className="px-6 py-3 text-right">實收</th>
                <th className="px-6 py-3">狀態</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
              {filtered.map((inv) => {
                const meta = INVOICE_STATUS_META[inv.status];
                return (
                  <tr key={inv.id} className="transition-colors hover:bg-surface-container">
                    <td className="px-6 py-4 font-medium">{inv.propertyName} {inv.unitNumber}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{inv.tenantName}</td>
                    <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">
                      {inv.periodStart} ~ {inv.periodEnd}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{inv.dueDate}</td>
                    <td className="px-6 py-4 text-right font-medium">NT$ {fmt(inv.totalAmount)}</td>
                    <td className="px-6 py-4 text-right text-on-surface-variant">NT$ {fmt(inv.totalPaid)}</td>
                    <td className="px-6 py-4"><StatusChip tone={meta.tone} label={meta.label} /></td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Link
                        href={`/finance/invoices/${inv.id}`}
                        className="rounded-full px-3 py-1 text-sm text-primary hover:bg-primary/8"
                      >
                        查看
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function fmt(n: number): string {
  return n.toLocaleString("zh-TW", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
