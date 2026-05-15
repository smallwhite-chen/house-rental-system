import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { AuditLogClient } from "./client";

export const metadata: Metadata = {
  title: "稽核紀錄 ｜ 房屋租賃管理系統",
};

const PAGE_SIZE = 50;

const ACTION_LABELS: Record<string, string> = {
  CREATE: "新增",
  UPDATE: "編輯",
  DELETE: "刪除",
  LOGIN: "登入",
  LOGOUT: "登出",
};

const MODULE_LABELS: Partial<Record<string, string>> = {
  SETTINGS_GENERAL: "系統基本設定",
  SETTINGS_ACCOUNTS: "帳號管理",
  SETTINGS_ROLES: "角色管理",
  SETTINGS_NOTIFICATIONS: "通知設定",
  SETTINGS_PAYMENT_METHODS: "收款方式",
  SETTINGS_PROPERTY_TYPES: "房產種類",
  SETTINGS_INCOME_TYPES: "收入種類",
  SETTINGS_EXPENSE_TYPES: "支出種類",
  SETTINGS_EQUIPMENT_TYPES: "設備種類",
  SETTINGS_COMMUNICATION_TAGS: "溝通標籤",
  SETTINGS_AUDIT_LOG: "稽核紀錄",
  DASHBOARD: "儀表板",
  PROPERTIES: "房產管理",
  TENANTS: "房客管理",
  CONTRACTS: "合約管理",
  INVOICES: "帳單管理",
  PAYMENTS: "收款紀錄",
  REPORTS: "財務報表",
  EXPENSES: "支出管理",
  COMMUNICATIONS: "溝通與維修",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string; userId?: string; from?: string; to?: string }>;
}) {
  await requirePermission("SETTINGS_AUDIT_LOG", "VIEW");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const actionFilter = sp.action || undefined;
  const userIdFilter = sp.userId || undefined;
  const fromDate = sp.from ? new Date(sp.from) : undefined;
  const toDate = sp.to ? new Date(sp.to + "T23:59:59") : undefined;

  const where = {
    ...(actionFilter ? { action: actionFilter as never } : {}),
    ...(userIdFilter ? { userId: userIdFilter } : {}),
    ...(fromDate || toDate ? { timestamp: { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) } } : {}),
  };

  const [total, logs, users] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const serialized = logs.map((log) => ({
    id: log.id,
    timestamp: log.timestamp.toISOString(),
    userName: log.user?.name ?? null,
    userEmail: log.user?.email ?? null,
    module: log.module ? (MODULE_LABELS[log.module] ?? log.module) : null,
    action: ACTION_LABELS[log.action] ?? log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    ipAddress: log.ipAddress,
  }));

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/settings" className="hover:text-on-surface hover:underline">系統設定</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">稽核紀錄</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">稽核紀錄</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          系統操作記錄（保留最近 3 個月，共 {total} 筆）
        </p>
      </header>

      <AuditLogClient
        logs={serialized}
        users={users}
        total={total}
        page={page}
        totalPages={totalPages}
        currentFilters={{ action: actionFilter, userId: userIdFilter, from: sp.from, to: sp.to }}
      />
    </div>
  );
}
