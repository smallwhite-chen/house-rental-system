import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { UserMenu } from "./UserMenu";
import { NotificationBell, type NotificationItem } from "./NotificationBell";
import { markAsRead } from "@/app/(dashboard)/notifications/actions";

/**
 * Top App Bar — 高 56px (h-14)。
 *
 * 左側：Logo + 公司名稱
 * 右側：NotificationBell + UserMenu
 *
 * 由 (dashboard)/layout.tsx 渲染並從 session/db 取得使用者資料後傳入。
 */
export async function TopAppBar({
  companyName,
  user,
}: {
  companyName: string;
  user: { id: string; name: string; email: string; roleName: string };
}) {
  // 取最近 10 則通知 + 未讀總數（伺服端 fetch，配合 revalidatePath 即時更新）
  const [recent, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { rule: { select: { template: { select: { displayName: true } } } } },
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  const items: NotificationItem[] = recent.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    ruleName: n.rule?.template.displayName ?? null,
    createdAt: n.createdAt.toISOString(),
    read: n.readAt !== null,
  }));

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-outline-variant bg-surface px-6">
      <Link
        href="/dashboard"
        className="flex items-center gap-3 transition-opacity hover:opacity-80"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.06l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 0 0 1.061 1.06l8.69-8.69Z" />
            <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.43Z" />
          </svg>
        </div>
        <span className="text-base font-medium text-on-surface">{companyName}</span>
      </Link>

      <div className="flex items-center gap-1">
        <NotificationBell
          notifications={items}
          unreadCount={unreadCount}
          markAsReadAction={markAsRead}
        />
        <UserMenu name={user.name} email={user.email} roleName={user.roleName} />
      </div>
    </header>
  );
}
