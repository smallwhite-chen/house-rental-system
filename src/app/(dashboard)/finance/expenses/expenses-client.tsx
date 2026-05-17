"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SelectChevron } from "@/components/ui/Select";
import type { ExpenseLevel } from "@/generated/prisma/client";

type ExpenseRow = {
  id: string;
  expenseDate: string;
  typeName: string;
  typeId: string;
  amount: number;
  level: ExpenseLevel;
  propertyId: string;
  propertyName: string;
  unitId: string | null;
  unitNumber: string | null;
  receiptUrl: string | null;
  note: string | null;
};

type Option = { id: string; name: string };
type UnitOption = { id: string; number: string; propertyId: string };

type LevelFilter = "ALL" | ExpenseLevel;

const LEVEL_LABELS: Record<ExpenseLevel, string> = {
  PROPERTY: "🏢 房產",
  UNIT: "🚪 房間",
};

export function ExpensesClient({
  expenses,
  properties,
  units,
  expenseTypes,
  canCreate,
}: {
  expenses: ExpenseRow[];
  properties: Option[];
  units: UnitOption[];
  expenseTypes: Option[];
  canCreate: boolean;
}) {
  const [query, setQuery] = useState("");
  const [propertyId, setPropertyId] = useState<string>("ALL");
  const [unitId, setUnitId] = useState<string>("ALL");
  const [typeId, setTypeId] = useState<string>("ALL");
  const [level, setLevel] = useState<LevelFilter>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // 依房產過濾房間下拉選項
  const availableUnits = propertyId === "ALL"
    ? units
    : units.filter((u) => u.propertyId === propertyId);

  // 切房產時清空房間篩選
  function handlePropertyChange(value: string) {
    setPropertyId(value);
    setUnitId("ALL");
  }

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (propertyId !== "ALL" && e.propertyId !== propertyId) return false;
      if (unitId !== "ALL" && e.unitId !== unitId) return false;
      if (typeId !== "ALL" && e.typeId !== typeId) return false;
      if (level !== "ALL" && e.level !== level) return false;
      if (from && e.expenseDate < from) return false;
      if (to && e.expenseDate > to) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const haystack = `${e.typeName} ${e.note ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [expenses, propertyId, unitId, typeId, level, from, to, query]);

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);

  function clearAll() {
    setQuery("");
    setPropertyId("ALL");
    setUnitId("ALL");
    setTypeId("ALL");
    setLevel("ALL");
    setFrom("");
    setTo("");
  }
  const hasAnyFilter =
    !!query || propertyId !== "ALL" || unitId !== "ALL" || typeId !== "ALL" || level !== "ALL" || !!from || !!to;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-medium text-on-surface">支出管理</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            共 {expenses.length} 筆支出（顯示 {filtered.length}，合計 NT$ {money(totalAmount)}）
          </p>
        </div>
        {canCreate && (
          <Link href="/finance/expenses/new">
            <Button variant="filled" leadingIcon={<PlusIcon />}>新增支出</Button>
          </Link>
        )}
      </header>

      {/* 篩選列 */}
      <div className="space-y-3 rounded-2xl bg-surface p-4 ring-1 ring-outline-variant">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋支出種類或備註…"
              className="block w-full rounded-full border-0 bg-surface px-5 py-2.5 text-sm text-on-surface ring-1 ring-inset ring-outline placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <FilterSelect label="房產" value={propertyId} onChange={handlePropertyChange}>
            <option value="ALL">全部</option>
            {properties.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </FilterSelect>

          <FilterSelect label="房間" value={unitId} onChange={setUnitId} disabled={propertyId === "ALL"}>
            <option value="ALL">{propertyId === "ALL" ? "請先選房產" : "全部"}</option>
            {availableUnits.map((u) => (<option key={u.id} value={u.id}>{u.number}</option>))}
          </FilterSelect>

          <FilterSelect label="支出種類" value={typeId} onChange={setTypeId}>
            <option value="ALL">全部</option>
            {expenseTypes.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
          </FilterSelect>

          <FilterSelect label="層級" value={level} onChange={(v) => setLevel(v as LevelFilter)}>
            <option value="ALL">全部</option>
            <option value="PROPERTY">🏢 房產層級</option>
            <option value="UNIT">🚪 房間層級</option>
          </FilterSelect>

          <FilterDate label="起始日" value={from} onChange={setFrom} />
          <FilterDate label="結束日" value={to} onChange={setTo} />

          {hasAnyFilter && (
            <button
              type="button"
              onClick={clearAll}
              className="self-end rounded-full px-3 py-2 text-sm text-primary hover:bg-primary/8"
            >
              清除篩選
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-surface py-16 text-center text-sm text-on-surface-variant ring-1 ring-outline-variant">
          {expenses.length === 0 ? "尚無支出紀錄。" : "此篩選條件下無支出。"}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-outline-variant">
          <table className="w-full">
            <thead className="bg-surface-container-high text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-6 py-3">日期</th>
                <th className="px-6 py-3">種類</th>
                <th className="px-6 py-3 text-right">金額</th>
                <th className="px-6 py-3">層級</th>
                <th className="px-6 py-3">房產 / 房間</th>
                <th className="px-6 py-3">收據</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
              {filtered.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-surface-container">
                  <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{e.expenseDate}</td>
                  <td className="px-6 py-4 font-medium">{e.typeName}</td>
                  <td className="px-6 py-4 text-right font-medium">NT$ {money(e.amount)}</td>
                  <td className="px-6 py-4 text-xs">{LEVEL_LABELS[e.level]}</td>
                  <td className="px-6 py-4 text-on-surface-variant">
                    {e.propertyName}{e.unitNumber ? ` · ${e.unitNumber}` : ""}
                  </td>
                  <td className="px-6 py-4">
                    {e.receiptUrl ? (
                      <a href={e.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                        檢視
                      </a>
                    ) : (
                      <span className="text-outline">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Link
                      href={`/finance/expenses/${e.id}/edit`}
                      className="rounded-full px-3 py-1 text-sm text-primary hover:bg-primary/8"
                    >
                      編輯
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-outline-variant bg-surface-container/50">
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-on-surface-variant" colSpan={2}>合計（依目前篩選）</td>
                <td className="px-6 py-3 text-right font-medium">NT$ {money(totalAmount)}</td>
                <td colSpan={4}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label, value, onChange, disabled, children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-on-surface-variant">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="block appearance-none rounded-lg bg-surface-container-high pl-3 pr-9 py-2 text-sm text-on-surface ring-1 ring-outline focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {children}
        </select>
        <SelectChevron />
      </div>
    </div>
  );
}

function FilterDate({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-on-surface-variant">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface ring-1 ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

function money(n: number): string {
  return n.toLocaleString("zh-TW", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
    </svg>
  );
}
