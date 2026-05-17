"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { SelectChevron } from "@/components/ui/Select";

type LogRow = {
  id: string;
  timestamp: string;
  userName: string | null;
  userEmail: string | null;
  module: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  ipAddress: string | null;
};

type Filters = {
  action?: string;
  userId?: string;
  from?: string;
  to?: string;
};

type Props = {
  logs: LogRow[];
  users: { id: string; name: string }[];
  total: number;
  page: number;
  totalPages: number;
  currentFilters: Filters;
};

const ACTION_OPTIONS = [
  { value: "", label: "全部操作" },
  { value: "CREATE", label: "新增" },
  { value: "UPDATE", label: "編輯" },
  { value: "DELETE", label: "刪除" },
  { value: "LOGIN", label: "登入" },
  { value: "LOGOUT", label: "登出" },
];

const ACTION_TONE: Record<string, string> = {
  新增: "bg-status-rented/12 text-status-rented",
  編輯: "bg-primary/10 text-primary",
  刪除: "bg-error/10 text-error",
  登入: "bg-secondary-container text-on-secondary-container",
  登出: "bg-surface-container-high text-on-surface-variant",
};

export function AuditLogClient({ logs, users, total, page, totalPages, currentFilters }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const pushFilter = useCallback((updates: Partial<Filters & { page?: number }>) => {
    const params = new URLSearchParams();
    const merged = { ...currentFilters, page: 1, ...updates };
    if (merged.action) params.set("action", merged.action);
    if (merged.userId) params.set("userId", merged.userId);
    if (merged.from) params.set("from", merged.from);
    if (merged.to) params.set("to", merged.to);
    if ((merged.page ?? 1) > 1) params.set("page", String(merged.page));
    router.push(`${pathname}?${params.toString()}`);
  }, [currentFilters, router, pathname]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-surface p-4 ring-1 ring-outline-variant">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-on-surface-variant">操作類型</label>
          <div className="relative">
            <select
              className="block w-full appearance-none rounded-lg bg-surface-container-high pl-3 pr-9 py-2 text-sm text-on-surface ring-1 ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
              value={currentFilters.action ?? ""}
              onChange={(e) => pushFilter({ action: e.target.value || undefined })}
            >
              {ACTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-on-surface-variant">帳號</label>
          <div className="relative">
            <select
              className="block w-full appearance-none rounded-lg bg-surface-container-high pl-3 pr-9 py-2 text-sm text-on-surface ring-1 ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
              value={currentFilters.userId ?? ""}
              onChange={(e) => pushFilter({ userId: e.target.value || undefined })}
            >
              <option value="">全部帳號</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-on-surface-variant">起始日期</label>
          <input
            type="date"
            className="rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface ring-1 ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
            value={currentFilters.from ?? ""}
            onChange={(e) => pushFilter({ from: e.target.value || undefined })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-on-surface-variant">結束日期</label>
          <input
            type="date"
            className="rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface ring-1 ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
            value={currentFilters.to ?? ""}
            onChange={(e) => pushFilter({ to: e.target.value || undefined })}
          />
        </div>

        {(currentFilters.action || currentFilters.userId || currentFilters.from || currentFilters.to) && (
          <button
            className="rounded-full px-3 py-2 text-sm text-primary hover:bg-primary/8"
            onClick={() => pushFilter({ action: undefined, userId: undefined, from: undefined, to: undefined })}
          >
            清除篩選
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-outline-variant">
        {logs.length === 0 ? (
          <div className="py-16 text-center text-sm text-on-surface-variant">此篩選條件下無稽核紀錄</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-high text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">操作時間</th>
                  <th className="px-4 py-3">帳號</th>
                  <th className="px-4 py-3">模組</th>
                  <th className="px-4 py-3">操作</th>
                  <th className="px-4 py-3">對象</th>
                  <th className="px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container">
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-on-surface-variant">
                      {new Date(log.timestamp).toLocaleString("zh-TW", { hour12: false })}
                    </td>
                    <td className="px-4 py-3">
                      {log.userName ? (
                        <div>
                          <div className="font-medium text-on-surface">{log.userName}</div>
                          <div className="text-xs text-on-surface-variant">{log.userEmail}</div>
                        </div>
                      ) : (
                        <span className="text-outline">系統</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {log.module ?? <span className="text-outline">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ACTION_TONE[log.action] ?? "bg-surface-container text-on-surface-variant"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {log.targetType ? (
                        <span className="font-mono text-xs">{log.targetType}</span>
                      ) : (
                        <span className="text-outline">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">
                      {log.ipAddress ?? <span className="text-outline">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-on-surface-variant">
          <span>共 {total} 筆，第 {page} / {totalPages} 頁</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => pushFilter({ page: page - 1 })}
              className="rounded-full px-3 py-1 hover:bg-surface-container disabled:opacity-40"
            >
              上一頁
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => pushFilter({ page: page + 1 })}
              className="rounded-full px-3 py-1 hover:bg-surface-container disabled:opacity-40"
            >
              下一頁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
