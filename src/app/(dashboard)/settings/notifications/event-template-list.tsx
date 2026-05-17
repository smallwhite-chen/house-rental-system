"use client";
import { useState, useTransition } from "react";
import type {
  NotificationEventKey,
  NotificationEventType,
} from "@/generated/prisma/client";

type Template = {
  eventKey: NotificationEventKey;
  eventType: NotificationEventType;
  displayName: string;
  enabled: boolean;
  moduleLabel: string;
};

type Props = {
  templates: Template[];
  canEdit: boolean;
  /** 切換指定事件的啟用狀態（傳入新值）。 */
  onToggle: (
    eventKey: NotificationEventKey,
    enabled: boolean
  ) => Promise<{ error?: string; ok?: true }>;
};

export function EventTemplateList({ templates, canEdit, onToggle }: Props) {
  const [pendingKey, setPendingKey] = useState<NotificationEventKey | null>(null);
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();

  function handleToggle(eventKey: NotificationEventKey, currentEnabled: boolean) {
    setError("");
    setPendingKey(eventKey);
    start(async () => {
      const res = await onToggle(eventKey, !currentEnabled);
      if (res?.error) setError(res.error);
      setPendingKey(null);
    });
  }

  return (
    <>
      <table className="w-full">
        <thead className="bg-surface-container-high text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
          <tr>
            <th className="px-6 py-3">模組</th>
            <th className="px-6 py-3">事件名稱</th>
            <th className="px-6 py-3">類型</th>
            <th className="px-6 py-3">狀態</th>
            <th className="px-6 py-3 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
          {templates.map((t) => {
            const busy = pendingKey === t.eventKey && isPending;
            return (
              <tr key={t.eventKey} className="hover:bg-surface-container/50">
                <td className="px-6 py-3 text-on-surface-variant">{t.moduleLabel}</td>
                <td className="px-6 py-3 font-medium">{t.displayName}</td>
                <td className="px-6 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-2 py-0.5 text-xs text-on-surface-variant">
                    {t.eventType === "SCHEDULED" ? "⏰ 時間型" : "⚡ 事件型"}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.enabled
                        ? "bg-status-rented/12 text-status-rented"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {t.enabled ? "啟用" : "停用"}
                  </span>
                </td>
                <td className="px-6 py-3 text-right whitespace-nowrap">
                  {canEdit && (
                    <button
                      onClick={() => handleToggle(t.eventKey, t.enabled)}
                      disabled={busy}
                      className={`rounded-full px-3 py-1 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                        t.enabled
                          ? "text-on-surface-variant hover:bg-surface-container"
                          : "text-primary hover:bg-primary/8"
                      }`}
                    >
                      {busy ? "處理中…" : t.enabled ? "停用" : "啟用"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {error && <p className="px-6 py-2 text-sm text-error">{error}</p>}
    </>
  );
}
