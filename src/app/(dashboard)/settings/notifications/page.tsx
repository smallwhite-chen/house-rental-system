import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { ChannelForm } from "./channel-form";
import { EventTemplateList } from "./event-template-list";
import { RulesList } from "./rules-list";
import {
  updateChannelSettings,
  toggleEventTemplate,
  deleteNotificationRule,
  sendTestNotification,
} from "./actions";

export const metadata: Metadata = {
  title: "通知與提醒設定 ｜ 房屋租賃管理系統",
};

const MODULE_LABEL: Record<string, string> = {
  CONTRACT_CREATED: "合約管理",
  CONTRACT_EXPIRING: "合約管理",
  CONTRACT_RENEWAL_DUE: "合約管理",
  CONTRACT_TERMINATED: "合約管理",
  INVOICE_GENERATED: "租金管理",
  RENT_DUE_SOON: "租金管理",
  RENT_OVERDUE: "租金管理",
  PAYMENT_RECEIVED: "租金管理",
};

export default async function NotificationsPage() {
  const ctx = await requirePermission("SETTINGS_NOTIFICATIONS", "VIEW");
  const canEdit = hasPermission(ctx, "SETTINGS_NOTIFICATIONS", "EDIT");
  const canCreate = hasPermission(ctx, "SETTINGS_NOTIFICATIONS", "CREATE");
  const canDelete = hasPermission(ctx, "SETTINGS_NOTIFICATIONS", "DELETE");

  const [channel, templates, rules] = await Promise.all([
    prisma.notificationChannelSettings.findUnique({ where: { id: "singleton" } }),
    prisma.notificationEventTemplate.findMany({ orderBy: { eventKey: "asc" } }),
    prisma.notificationRule.findMany({
      orderBy: [{ enabled: "desc" }, { createdAt: "desc" }],
      include: {
        template: { select: { displayName: true, eventType: true } },
        _count: { select: { recipients: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/settings" className="hover:text-on-surface hover:underline">系統設定</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">通知與提醒設定</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">通知與提醒設定</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          設定通知管道、可觸發事件清單，以及自訂規則。本 phase 為設定介面；實際寄送由後續 cron / event hook 串接。
        </p>
      </header>

      {/* ── 區塊 A：通知管道設定 ── */}
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-on-surface-variant">
          📡 通知管道設定
        </h2>
        <ChannelForm
          initial={{
            emailSenderName: channel?.emailSenderName ?? "",
            emailSenderAddress: channel?.emailSenderAddress ?? "",
            emailEnabled: channel?.emailEnabled ?? true,
            inAppEnabled: channel?.inAppEnabled ?? true,
          }}
          disabled={!canEdit}
          onSubmit={updateChannelSettings}
        />
      </section>

      {/* ── 區塊 B：觸發事件清單（手風琴，預設收起） ── */}
      <section>
        <details className="group overflow-hidden rounded-2xl bg-surface ring-1 ring-outline-variant">
          <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 transition-colors hover:bg-surface-container/50 [&::-webkit-details-marker]:hidden">
            <div>
              <h2 className="text-sm font-medium uppercase tracking-wide text-on-surface-variant">
                ⚡ 觸發事件清單
              </h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                系統預定義 8 個事件（不可新增/改名），可切換各事件啟用狀態
              </p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5 text-on-surface-variant transition-transform duration-200 group-open:rotate-180"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </summary>
          <div className="border-t border-outline-variant">
            <EventTemplateList
              templates={templates.map((t) => ({
                eventKey: t.eventKey,
                eventType: t.eventType,
                displayName: t.displayName,
                enabled: t.enabled,
                moduleLabel: MODULE_LABEL[t.eventKey] ?? "—",
              }))}
              canEdit={canEdit}
              onToggle={toggleEventTemplate}
            />
          </div>
        </details>
      </section>

      {/* ── 區塊 C：通知規則 ── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-on-surface-variant">
            📋 通知規則（共 {rules.length} 條）
          </h2>
          {canCreate && (
            <Link
              href="/settings/notifications/rules/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-medium text-on-primary shadow-sm hover:bg-primary/90"
            >
              + 新增規則
            </Link>
          )}
        </div>
        <RulesList
          rules={rules.map((r) => ({
            id: r.id,
            eventDisplayName: r.template.displayName,
            eventType: r.template.eventType,
            daysOffset: r.daysOffset,
            title: r.title,
            emailEnabled: r.emailEnabled,
            inAppEnabled: r.inAppEnabled,
            recipientCount: r._count.recipients,
            enabled: r.enabled,
          }))}
          canEdit={canEdit}
          canDelete={canDelete}
          deleteAction={deleteNotificationRule}
          testAction={sendTestNotification}
        />
      </section>
    </div>
  );
}
