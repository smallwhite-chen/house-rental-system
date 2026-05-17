/**
 * 財務報表聚合 helper（Phase 6c / SPEC §7.3）。
 *
 * 把原始 PaymentRecord / Expense 列轉成:
 *  - 月份序列（YYYY-MM → 金額、筆數）
 *  - 種類分布（種類名 → 金額、筆數、佔比）
 *  - 收/支對照與累積淨收益
 *
 * 全部 in-memory 計算（資料量不會大；無需做 SQL group by）。
 */

export type DatedAmount = {
  date: Date;
  amount: number;
};

export type CategorizedAmount = DatedAmount & {
  categoryId: string;
  categoryName: string;
};

export type MonthlyPoint = {
  month: string; // YYYY-MM
  amount: number;
  count: number;
};

export type CategoryPoint = {
  categoryId: string;
  categoryName: string;
  amount: number;
  count: number;
  ratio: number; // 0~1
};

export type PnlMonthlyPoint = {
  month: string;
  income: number;
  expense: number;
  net: number; // income - expense
  cumulative: number; // 累積淨收益
};

/** 取得 YYYY-MM 字串（server local time）。 */
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** 列出 [from, to] 區間內的所有月份 key（含端點月份），便於補 0 點。 */
function listMonths(from: Date, to: Date): string[] {
  const months: string[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  while (cursor <= end) {
    months.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

/** 月份序列聚合：依日期分組求 sum + count，並補上區間內缺月為 0。 */
export function aggregateByMonth(
  rows: DatedAmount[],
  from: Date,
  to: Date
): MonthlyPoint[] {
  const map = new Map<string, { amount: number; count: number }>();
  for (const r of rows) {
    const k = monthKey(r.date);
    const cur = map.get(k) ?? { amount: 0, count: 0 };
    cur.amount += r.amount;
    cur.count += 1;
    map.set(k, cur);
  }
  return listMonths(from, to).map((m) => {
    const cur = map.get(m) ?? { amount: 0, count: 0 };
    return { month: m, amount: round2(cur.amount), count: cur.count };
  });
}

/** 依種類聚合：sum + count，並計算佔總額比例。 */
export function aggregateByCategory(rows: CategorizedAmount[]): CategoryPoint[] {
  const map = new Map<string, { id: string; name: string; amount: number; count: number }>();
  for (const r of rows) {
    const cur = map.get(r.categoryId) ?? {
      id: r.categoryId,
      name: r.categoryName,
      amount: 0,
      count: 0,
    };
    cur.amount += r.amount;
    cur.count += 1;
    map.set(r.categoryId, cur);
  }
  const arr = Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  const total = arr.reduce((s, x) => s + x.amount, 0);
  return arr.map((x) => ({
    categoryId: x.id,
    categoryName: x.name,
    amount: round2(x.amount),
    count: x.count,
    ratio: total > 0 ? x.amount / total : 0,
  }));
}

/** 損益月份對照：合併 income / expense 月度資料 + 計算累積淨收益。 */
export function buildPnlMonthly(
  income: MonthlyPoint[],
  expense: MonthlyPoint[]
): PnlMonthlyPoint[] {
  const expenseMap = new Map(expense.map((e) => [e.month, e.amount]));
  let cumulative = 0;
  return income.map((i) => {
    const exp = expenseMap.get(i.month) ?? 0;
    const net = round2(i.amount - exp);
    cumulative = round2(cumulative + net);
    return { month: i.month, income: i.amount, expense: exp, net, cumulative };
  });
}

/** 總計區塊資料（給卡片用）。 */
export type TotalSummary = {
  totalIncome: number;
  totalExpense: number;
  net: number;
  marginRatio: number; // net / totalIncome（無收入時為 0）
};

export function buildTotalSummary(income: MonthlyPoint[], expense: MonthlyPoint[]): TotalSummary {
  const totalIncome = round2(income.reduce((s, x) => s + x.amount, 0));
  const totalExpense = round2(expense.reduce((s, x) => s + x.amount, 0));
  const net = round2(totalIncome - totalExpense);
  const marginRatio = totalIncome > 0 ? net / totalIncome : 0;
  return { totalIncome, totalExpense, net, marginRatio };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** 快速期間：依 preset 算出 [from, to]。Server-side 使用。 */
export type DatePreset = "thisMonth" | "thisQuarter" | "thisYear" | "lastYear";

export function getPresetRange(
  preset: DatePreset,
  now: Date = new Date()
): { from: Date; to: Date } {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case "thisMonth": {
      const from = new Date(y, m, 1);
      const to = new Date(y, m + 1, 0, 23, 59, 59); // 本月最後一天
      return { from, to };
    }
    case "thisQuarter": {
      const qStart = Math.floor(m / 3) * 3;
      const from = new Date(y, qStart, 1);
      const to = new Date(y, qStart + 3, 0, 23, 59, 59);
      return { from, to };
    }
    case "thisYear":
      return { from: new Date(y, 0, 1), to: new Date(y, 11, 31, 23, 59, 59) };
    case "lastYear":
      return { from: new Date(y - 1, 0, 1), to: new Date(y - 1, 11, 31, 23, 59, 59) };
  }
}
