"use client";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import type { PnlMonthlyPoint } from "@/lib/report-aggregator";

type Props = {
  monthly: PnlMonthlyPoint[];
};

export function PnlReport({ monthly }: Props) {
  const hasData = monthly.some((m) => m.income > 0 || m.expense > 0);

  return (
    <div className="space-y-6">
      {/* 收入 vs 支出 雙列長條圖 */}
      <section className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="mb-4 text-lg font-medium text-on-surface">每月收入 vs 支出</h2>
        {!hasData ? (
          <p className="py-16 text-center text-sm text-on-surface-variant">無資料</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dce5de" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => `NT$ ${Number(value).toLocaleString("zh-TW")}`} />
                <Legend />
                <Bar dataKey="income" name="收入" fill="#2d6a4f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="支出" fill="#b3261e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* 累積淨收益折線圖 */}
      <section className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="mb-4 text-lg font-medium text-on-surface">累積淨收益走勢</h2>
        {!hasData ? (
          <p className="py-16 text-center text-sm text-on-surface-variant">無資料</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dce5de" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => `NT$ ${Number(value).toLocaleString("zh-TW")}`} />
                <ReferenceLine y={0} stroke="#79747e" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  name="累積淨收益"
                  stroke="#1565c0"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#1565c0" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* 月份明細表 */}
      <section className="rounded-2xl bg-surface ring-1 ring-outline-variant">
        <header className="px-6 py-4 border-b border-outline-variant">
          <h2 className="text-lg font-medium text-on-surface">月份明細</h2>
        </header>
        <table className="w-full">
          <thead className="bg-surface-container-high text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
            <tr>
              <th className="px-6 py-3">月份</th>
              <th className="px-6 py-3 text-right">收入</th>
              <th className="px-6 py-3 text-right">支出</th>
              <th className="px-6 py-3 text-right">本月淨額</th>
              <th className="px-6 py-3 text-right">累積淨額</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
            {monthly.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                  此期間內無資料
                </td>
              </tr>
            ) : (
              monthly.map((m) => (
                <tr key={m.month} className="hover:bg-surface-container/50">
                  <td className="px-6 py-3 font-mono">{m.month}</td>
                  <td className="px-6 py-3 text-right text-status-rented">
                    NT$ {m.income.toLocaleString("zh-TW", { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-6 py-3 text-right text-status-overdue">
                    NT$ {m.expense.toLocaleString("zh-TW", { maximumFractionDigits: 0 })}
                  </td>
                  <td className={`px-6 py-3 text-right font-medium ${m.net >= 0 ? "text-status-completed" : "text-status-overdue"}`}>
                    {m.net >= 0 ? "+" : ""}
                    NT$ {m.net.toLocaleString("zh-TW", { maximumFractionDigits: 0 })}
                  </td>
                  <td className={`px-6 py-3 text-right font-medium ${m.cumulative >= 0 ? "text-on-surface" : "text-status-overdue"}`}>
                    NT$ {m.cumulative.toLocaleString("zh-TW", { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
