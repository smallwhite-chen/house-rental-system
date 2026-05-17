import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { RuleForm } from "../../../rule-form";
import { updateNotificationRule } from "../../../actions";

export const metadata: Metadata = {
  title: "編輯通知規則 ｜ 房屋租賃管理系統",
};

export default async function EditRulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("SETTINGS_NOTIFICATIONS", "EDIT");
  const { id } = await params;

  const [rule, templates, users] = await Promise.all([
    prisma.notificationRule.findUnique({
      where: { id },
      include: { recipients: { select: { userId: true } } },
    }),
    prisma.notificationEventTemplate.findMany({
      where: { enabled: true },
      orderBy: { eventKey: "asc" },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  if (!rule) notFound();

  const action = updateNotificationRule.bind(null, id);

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/settings" className="hover:text-on-surface hover:underline">系統設定</Link></li>
          <li aria-hidden="true">›</li>
          <li><Link href="/settings/notifications" className="hover:text-on-surface hover:underline">通知與提醒設定</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">編輯：{rule.title}</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">編輯通知規則</h1>
      </header>

      <RuleForm
        events={templates.map((t) => ({
          eventKey: t.eventKey,
          eventType: t.eventType,
          displayName: t.displayName,
        }))}
        users={users}
        initial={{
          eventKey: rule.eventKey,
          daysOffset: rule.daysOffset,
          emailEnabled: rule.emailEnabled,
          inAppEnabled: rule.inAppEnabled,
          title: rule.title,
          body: rule.body,
          enabled: rule.enabled,
          recipientIds: rule.recipients.map((r) => r.userId),
        }}
        submitLabel="儲存變更"
        onSubmit={action}
      />
    </div>
  );
}
