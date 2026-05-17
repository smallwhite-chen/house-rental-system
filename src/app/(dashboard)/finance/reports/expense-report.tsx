"use client";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { CategoryPoint, MonthlyPoint } from "@/lib/report-aggregator";

type Props = {
  monthly: MonthlyPoint[];
  byCategory: CategoryPoint[];
  totalCount: number;
  totalAmount: number;
};

// 種類圓餅圖配色（依序輪用）
const PIE_COLORS = [
  "#2d6a4f", // 主色 forest green
  "#f9a825", // status-maintenance
  "#b3261e", // status-overdue
  "#1565c0", // status-completed
  "#7d5260", // tertiary
  "#79747e", // status-vacant
  "#51635d", // secondary
];

export function ExpenseReport({ monthly, byCategory, totalCount, totalAmount }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 圓餅圖：依種類分布 */}
        <section className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
          <h2 className="mb-4 text-lg font-medium text-on-surface">依支出種類分布</h2>
          {byCategory.length === 0 ? (
            <p className="py-16 text-center text-sm text-on-surface-variant">無資料</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="amount"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry: { name?: string }) => entry.name ?? ""}
                  >
                    {byCategory.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `NT$ ${Number(value).toLocaleString("zh-TW")}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* 長條圖：每月支出 */}
        <section className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
          <h2 className="mb-4 text-lg font-medium text-on-surface">每月支出</h2>
          {monthly.length === 0 || totalAmount === 0 ? (
            <p className="py-16 text-center text-sm text-on-surface-variant">無資料</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dce5de" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => [`NT$ ${Number(value).toLocaleString("zh-TW")}`, "金額"]} />
                  <Bar dataKey="amount" fill="#b3261e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* 種類明細表 */}
      <section className="rounded-2xl bg-surface ring-1 ring-outline-variant">
        <header className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="text-lg font-medium text-on-surface">支出種類明細</h2>
          <span className="text-sm text-on-surface-variant">共 {totalCount} 筆</span>
        </header>
        <table className="w-full">
          <thead className="bg-surface-container-high text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
            <tr>
              <th className="px-6 py-3">種類</th>
              <th className="px-6 py-3 text-right">筆數</th>
              <th className="px-6 py-3 text-right">金額</th>
              <th className="px-6 py-3 text-right">佔比</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
            {byCategory.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-on-surface-variant">
                  此期間內無支出紀錄
                </td>
              </tr>
            ) : (
              <>
                {byCategory.map((c, idx) => (
                  <tr key={c.categoryId} className="hover:bg-surface-container/50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                          aria-hidden="true"
                        />
                        {c.categoryName}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right text-on-surface-variant">{c.count}</td>
                    <td className="px-6 py-3 text-right font-medium">
                      NT$ {c.amount.toLocaleString("zh-TW", { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-6 py-3 text-right text-on-surface-variant">
                      {(c.ratio * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
                <tr className="bg-surface-container-high font-medium">
                  <td className="px-6 py-3">總計</td>
                  <td className="px-6 py-3 text-right">{totalCount}</td>
                  <td className="px-6 py-3 text-right">
                    NT$ {totalAmount.toLocaleString("zh-TW", { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-6 py-3 text-right">100%</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
