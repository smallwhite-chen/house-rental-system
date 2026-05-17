"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { MonthlyPoint } from "@/lib/report-aggregator";

type Props = {
  monthly: MonthlyPoint[];
  totalCount: number;
  totalAmount: number;
};

export function IncomeReport({ monthly, totalCount, totalAmount }: Props) {
  const avg = totalCount > 0 ? totalAmount / totalCount : 0;

  return (
    <div className="space-y-6">
      {/* 折線圖 */}
      <section className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="mb-4 text-lg font-medium text-on-surface">每月收款趨勢</h2>
        {monthly.length === 0 || totalAmount === 0 ? (
          <p className="py-16 text-center text-sm text-on-surface-variant">
            此期間內尚無收款紀錄
          </p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dce5de" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => [`NT$ ${Number(value).toLocaleString("zh-TW")}`, "收款金額"]}
                  labelFormatter={(label) => `月份：${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#2d6a4f"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#2d6a4f" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* 月份明細表 */}
      <section className="rounded-2xl bg-surface ring-1 ring-outline-variant">
        <header className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="text-lg font-medium text-on-surface">月份明細</h2>
          <span className="text-sm text-on-surface-variant">
            共 {totalCount} 筆 · 平均 NT$ {avg.toLocaleString("zh-TW", { maximumFractionDigits: 0 })}
          </span>
        </header>
        <table className="w-full">
          <thead className="bg-surface-container-high text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
            <tr>
              <th className="px-6 py-3">月份</th>
              <th className="px-6 py-3 text-right">收款筆數</th>
              <th className="px-6 py-3 text-right">總金額</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
            {monthly.map((m) => (
              <tr key={m.month} className="hover:bg-surface-container/50">
                <td className="px-6 py-3 font-mono">{m.month}</td>
                <td className="px-6 py-3 text-right text-on-surface-variant">{m.count}</td>
                <td className="px-6 py-3 text-right font-medium">
                  NT$ {m.amount.toLocaleString("zh-TW", { maximumFractionDigits: 0 })}
                </td>
              </tr>
            ))}
            <tr className="bg-surface-container-high font-medium">
              <td className="px-6 py-3">總計</td>
              <td className="px-6 py-3 text-right">{totalCount}</td>
              <td className="px-6 py-3 text-right">
                NT$ {totalAmount.toLocaleString("zh-TW", { maximumFractionDigits: 0 })}
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
