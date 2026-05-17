import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUserContext } from "@/lib/rbac";
import { NotificationsClient } from "./client";
import { markAsRead, markAllAsRead, deleteNotification } from "./actions";

export const metadata: Metadata = {
  title: "通知中心 ｜ 房屋租賃管理系統",
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const ctx = await requireUserContext();
  const sp = await searchParams;
  const filter = sp.status === "unread" || sp.status === "read" ? sp.status : "all";

  const where = {
    userId: ctx.id,
    ...(filter === "unread" ? { readAt: null } : {}),
    ...(filter === "read" ? { readAt: { not: null } } : {}),
  };

  const [items, totalUnread] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { rule: { select: { template: { select: { displayName: true } } } } },
    }),
    prisma.notification.count({ where: { userId: ctx.id, readAt: null } }),
  ]);

  return (
    <NotificationsClient
      items={items.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        ruleName: n.rule?.template.displayName ?? null,
        createdAt: n.createdAt.toISOString(),
        read: n.readAt !== null,
      }))}
      totalUnread={totalUnread}
      currentFilter={filter}
      markAsReadAction={markAsRead}
      markAllAsReadAction={markAllAsRead}
      deleteAction={deleteNotification}
    />
  );
}
