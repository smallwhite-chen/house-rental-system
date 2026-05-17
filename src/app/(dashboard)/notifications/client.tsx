"use client";
import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/relative-time";

type Item = {
  id: string;
  title: string;
  body: string;
  ruleName: string | null;
  createdAt: string;
  read: boolean;
};

type Filter = "all" | "unread" | "read";

type Props = {
  items: Item[];
  totalUnread: number;
  currentFilter: Filter;
  markAsReadAction: (id: string) => Promise<{ error?: string; ok?: true }>;
  markAllAsReadAction: () => Promise<{ error?: string; ok?: true; updated?: number }>;
  deleteAction: (id: string) => Promise<{ error?: string; ok?: true }>;
};

const FILTER_TABS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "unread", label: "未讀" },
  { key: "read", label: "已讀" },
];

export function NotificationsClient({
  items,
  totalUnread,
  currentFilter,
  markAsReadAction,
  markAllAsReadAction,
  deleteAction,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  function switchFilter(next: Filter) {
    const url = next === "all" ? pathname : `${pathname}?status=${next}`;
    router.push(url);
  }

  function handleMarkOne(id: string) {
    setError("");
    setPendingId(id);
    start(async () => {
      const res = await markAsReadAction(id);
      if (res?.error) setError(res.error);
      setPendingId(null);
    });
  }

  function handleMarkAll() {
    setError("");
    start(async () => {
      const res = await markAllAsReadAction();
      if (res?.error) setError(res.error);
    });
  }

  function handleDelete(id: string) {
    setError("");
    setPendingId(id);
    start(async () => {
      const res = await deleteAction(id);
      if (res?.error) setError(res.error);
      setPendingId(null);
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium text-on-surface">通知中心</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {totalUnread > 0 ? `共 ${totalUnread} 則未讀` : "全部已讀 🎉"}
          </p>
        </div>
        {totalUnread > 0 && (
          <Button variant="outlined" onClick={handleMarkAll} disabled={isPending}>
            {isPending ? "處理中…" : "全部標記為已讀"}
          </Button>
        )}
      </header>

      <div className="flex flex-wrap gap-1 rounded-full bg-surface-container-high p-1 w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => switchFilter(tab.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              currentFilter === tab.key
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      {items.length === 0 ? (
        <div className="rounded-2xl bg-surface py-16 text-center text-sm text-on-surface-variant ring-1 ring-outline-variant">
          {currentFilter === "unread"
            ? "目前沒有未讀通知 🎉"
            : currentFilter === "read"
            ? "尚無已讀通知"
            : "目前沒有任何通知"}
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl bg-surface ring-1 ring-outline-variant divide-y divide-outline-variant">
          {items.map((n) => (
            <li
              key={n.id}
              className={`relative flex items-start gap-3 px-6 py-4 ${
                !n.read ? "bg-primary-container/15" : ""
              }`}
            >
              {!n.read && (
                <span
                  className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  {!n.read && (
                    <span className="mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  )}
                  <p className={`text-sm ${!n.read ? "font-medium text-on-surface" : "text-on-surface-variant"}`}>
                    {n.title}
                  </p>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-on-surface-variant">{n.body}</p>
                <p className="mt-2 text-xs text-outline">
                  {formatRelativeTime(new Date(n.createdAt))}
                  <span className="ml-1.5 font-mono">· {n.createdAt.replace("T", " ").slice(0, 16)}</span>
                  {n.ruleName && <span className="ml-1.5">· 來自規則「{n.ruleName}」</span>}
                </p>
              </div>
              <div className="flex flex-col gap-1 items-end whitespace-nowrap">
                {!n.read && (
                  <button
                    onClick={() => handleMarkOne(n.id)}
                    disabled={pendingId === n.id && isPending}
                    className="rounded-full px-3 py-1 text-xs text-primary hover:bg-primary/8 disabled:opacity-50"
                  >
                    標為已讀
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  disabled={pendingId === n.id && isPending}
                  className="rounded-full px-3 py-1 text-xs text-error hover:bg-error/8 disabled:opacity-50"
                >
                  刪除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
