import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/rbac";
import { summarizeUnitStatuses } from "@/lib/unit-status";
import { COMMUNICATION_STATUS_META } from "@/lib/communication-status";
import { StatusChip } from "@/components/ui/StatusChip";
import { PropertyFilter } from "./property-filter";

export const metadata: Metadata = {
  title: "Dashboard ｜ 房屋租賃管理系統",
};

/**
 * Dashboard（SPEC §9）。
 *
 * 結構：
 * 1. 房產篩選器（URL searchParam: propertyId）
 * 2. 出租狀況總覽（4 卡）
 * 3. 本月收租狀況（3 卡）
 * 4. 近期合約到期提醒（10 筆）
 * 5. 待處理溝通事項（10 筆）
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string }>;
}) {
  const ctx = await requireUserContext();
  const sp = await searchParams;
  const propertyId = sp.propertyId && sp.propertyId !== "ALL" ? sp.propertyId : null;
  const currentValue = propertyId ?? "ALL";

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);

  // 全部房產 → 提供下拉用
  const properties = await prisma.property.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // ── 1. 房間狀態統計 ──
  const unitsRaw = await prisma.unit.findMany({
    where: propertyId ? { propertyId } : undefined,
    select: {
      manualStatus: true,
      contracts: {
        select: { startDate: true, endDate: true, manualStatus: true },
      },
    },
  });
  const unitCounts = summarizeUnitStatuses(unitsRaw, now);

  // ── 2. 本月帳單統計（依 dueDate 落在本月） ──
  const invoiceWhere = {
    dueDate: { gte: monthStart, lt: monthEnd },
    ...(propertyId ? { unit: { propertyId } } : {}),
  };
  const [paidCount, unpaidCount, overdueCount, partialCount] = await Promise.all([
    prisma.invoice.count({ where: { ...invoiceWhere, status: { in: ["PAID", "OVERPAID"] } } }),
    prisma.invoice.count({ where: { ...invoiceWhere, status: "UNPAID" } }),
    prisma.invoice.count({ where: { ...invoiceWhere, status: "OVERDUE" } }),
    prisma.invoice.count({ where: { ...invoiceWhere, status: "PARTIAL" } }),
  ]);

  // ── 3. 近期合約到期（30 天內 + 非已終結） ──
  const expiringContracts = await prisma.contract.findMany({
    where: {
      endDate: { gte: now, lte: in30Days },
      manualStatus: { notIn: ["TERMINATED", "COMPLETED"] },
      ...(propertyId ? { unit: { propertyId } } : {}),
    },
    orderBy: { endDate: "asc" },
    take: 10,
    include: {
      unit: { select: { number: true, property: { select: { name: true } } } },
      tenant: { select: { id: true, name: true } },
    },
  });

  // ── 4. 待處理溝通事項 ──
  const pendingLogs = await prisma.communicationLog.findMany({
    where: {
      status: "PENDING",
      ...(propertyId ? { unit: { propertyId } } : {}),
    },
    orderBy: [{ communicationDate: "desc" }],
    take: 10,
    include: {
      unit: { select: { number: true, property: { select: { name: true } } } },
      tenant: { select: { name: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium text-on-surface">歡迎回來，{ctx.name}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            目前資料來自{propertyId ? "選定房產" : "全部房產"}
          </p>
        </div>
        <PropertyFilter properties={properties} currentValue={currentValue} />
      </header>

      {/* ═══ 出租狀況總覽 ═══ */}
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-on-surface-variant">
          📊 出租狀況總覽（共 {unitCounts.total} 間）
        </h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard label="出租中" count={unitCounts.rented} tone="bg-status-rented/12 text-status-rented" />
          <StatCard label="空置" count={unitCounts.vacant} tone="bg-status-vacant/15 text-status-vacant" />
          <StatCard label="合約逾期" count={unitCounts.overdue} tone="bg-status-overdue/12 text-status-overdue" />
          <StatCard label="整修中" count={unitCounts.maintenance} tone="bg-status-maintenance/15 text-status-maintenance" />
        </div>
      </section>

      {/* ═══ 本月收租狀況（同 4 欄排版） ═══ */}
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-on-surface-variant">
          💰 本月收租狀況（{monthStart.toISOString().slice(0, 7)}）
        </h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard label="已收款" count={paidCount} tone="bg-status-rented/12 text-status-rented" />
          <StatCard label="未收款" count={unpaidCount + partialCount} tone="bg-status-vacant/15 text-status-vacant" hint={partialCount > 0 ? `含 ${partialCount} 筆部分收款` : undefined} />
          <StatCard label="逾期" count={overdueCount} tone="bg-status-overdue/12 text-status-overdue" />
          {/* 空 4 欄佔位（維持 4 欄寬度一致） */}
          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ═══ 近期合約到期 ═══ */}
        <section className="rounded-2xl bg-surface ring-1 ring-outline-variant">
          <header className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-on-surface-variant">
              📄 近期合約到期（30 天內）
            </h2>
            <span className="text-xs text-on-surface-variant">{expiringContracts.length} 筆</span>
          </header>
          {expiringContracts.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-on-surface-variant">
              目前無 30 天內到期的合約 🎉
            </p>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {expiringContracts.map((c) => {
                const daysLeft = Math.max(0, Math.ceil((c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                return (
                  <li key={c.id}>
                    <Link
                      href={`/contracts/${c.id}`}
                      className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-surface-container"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-on-surface">
                          {c.unit.property.name} {c.unit.number}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {c.tenant.name} · 結束日 {c.endDate.toISOString().slice(0, 10)}
                        </p>
                      </div>
                      <span className={`ml-3 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        daysLeft <= 7 ? "bg-status-overdue/12 text-status-overdue" : "bg-status-maintenance/15 text-status-maintenance"
                      }`}>
                        剩 {daysLeft} 天
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ═══ 待處理溝通事項 ═══ */}
        <section className="rounded-2xl bg-surface ring-1 ring-outline-variant">
          <header className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-on-surface-variant">
              💬 待處理溝通事項
            </h2>
            <span className="text-xs text-on-surface-variant">{pendingLogs.length} 筆</span>
          </header>
          {pendingLogs.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-on-surface-variant">
              目前無待處理事項 🎉
            </p>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {pendingLogs.map((log) => {
                const meta = COMMUNICATION_STATUS_META[log.status];
                const dateStr = formatDateTime(log.communicationDate);
                return (
                  <li key={log.id}>
                    <Link
                      href={`/communications/${log.id}/edit`}
                      className="block px-6 py-3 transition-colors hover:bg-surface-container"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-on-surface-variant">
                            <span className="font-mono">{dateStr}</span>
                            <span className="mx-1.5">·</span>
                            {log.unit.property.name} {log.unit.number}
                            <span className="mx-1.5">·</span>
                            {log.tenant.name}
                          </p>
                          <p className="mt-1 line-clamp-1 text-sm text-on-surface">{log.content}</p>
                          {log.tags.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {log.tags.map((lt) => (
                                <span key={lt.tag.id} className="rounded-full bg-surface-container-high px-2 py-0.5 text-xs text-on-surface-variant">
                                  {lt.tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <StatusChip tone={meta.tone} label={meta.label} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  count,
  tone,
  hint,
  kind,
}: {
  label: string;
  count: number;
  tone: string;
  hint?: string;
  /** 分類圖示：🏢 房間 / 💰 帳單 */
  kind?: string;
}) {
  return (
    <div className={`rounded-2xl p-5 ring-1 ring-outline-variant ${tone}`}>
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
        {kind && <span aria-hidden="true">{kind}</span>}
        <span>{label}</span>
      </p>
      <p className="mt-2 text-4xl font-medium">{count}</p>
      {hint && <p className="mt-1 text-xs opacity-80">{hint}</p>}
    </div>
  );
}

function formatDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
