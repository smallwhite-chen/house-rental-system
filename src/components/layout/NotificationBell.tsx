"use client";
import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/relative-time";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  ruleName: string | null;
  createdAt: string; // ISO string（client 端用 Date 重組）
  read: boolean;
};

type Props = {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsReadAction: (id: string) => Promise<{ error?: string; ok?: true }>;
};

/**
 * TopAppBar 鈴鐺 + dropdown 通知面板。
 *
 * - 未讀數紅點（>0 才顯示）
 * - 點擊 → 展開/收起
 * - 點任一筆未讀 → 標記為已讀 → revalidate
 * - 底部「查看全部」連結到 /notifications
 */
export function NotificationBell({ notifications, unreadCount, markAsReadAction }: Props) {
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  // 點 dropdown 以外區域 → 收起
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (open && ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleClickItem(n: NotificationItem) {
    if (!n.read) {
      start(async () => {
        await markAsReadAction(n.id);
      });
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`通知（${unreadCount} 則未讀）`}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-medium leading-none text-on-error">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl bg-surface shadow-xl ring-1 ring-outline-variant">
          <header className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
            <span className="text-sm font-medium text-on-surface">通知</span>
            <span className="text-xs text-on-surface-variant">
              {unreadCount > 0 ? `${unreadCount} 則未讀` : "全部已讀"}
            </span>
          </header>

          {notifications.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-on-surface-variant">
              目前沒有通知 🎉
            </div>
          ) : (
            <ul className="max-h-96 divide-y divide-outline-variant overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleClickItem(n)}
                    className={`block w-full text-left px-4 py-3 transition-colors hover:bg-surface-container ${
                      !n.read ? "bg-primary-container/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <span className="mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${!n.read ? "font-medium text-on-surface" : "text-on-surface-variant"}`}>
                          {n.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-on-surface-variant">{n.body}</p>
                        <p className="mt-1 text-xs text-outline">
                          {formatRelativeTime(new Date(n.createdAt))}
                          {n.ruleName && <span className="ml-1.5">· {n.ruleName}</span>}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <footer className="border-t border-outline-variant px-4 py-2 text-center">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-sm text-primary hover:underline"
            >
              查看全部
            </Link>
          </footer>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z" clipRule="evenodd" />
    </svg>
  );
}
