import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { RuleForm } from "../../rule-form";
import { createNotificationRule } from "../../actions";

export const metadata: Metadata = {
  title: "新增通知規則 ｜ 房屋租賃管理系統",
};

export default async function NewRulePage() {
  await requirePermission("SETTINGS_NOTIFICATIONS", "CREATE");

  const [templates, users] = await Promise.all([
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

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/settings" className="hover:text-on-surface hover:underline">系統設定</Link></li>
          <li aria-hidden="true">›</li>
          <li><Link href="/settings/notifications" className="hover:text-on-surface hover:underline">通知與提醒設定</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">新增規則</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">新增通知規則</h1>
      </header>

      <RuleForm
        events={templates.map((t) => ({
          eventKey: t.eventKey,
          eventType: t.eventType,
          displayName: t.displayName,
        }))}
        users={users}
        submitLabel="建立規則"
        onSubmit={createNotificationRule}
      />
    </div>
  );
}
