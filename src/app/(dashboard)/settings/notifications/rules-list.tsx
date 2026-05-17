"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { NotificationEventType } from "@/generated/prisma/client";

type RuleRow = {
  id: string;
  eventDisplayName: string;
  eventType: NotificationEventType;
  daysOffset: number | null;
  title: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  recipientCount: number;
  enabled: boolean;
};

type Props = {
  rules: RuleRow[];
  canEdit: boolean;
  canDelete: boolean;
  deleteAction: (id: string) => Promise<{ error?: string } | void>;
  testAction: (ruleId: string) => Promise<{ error?: string; ok?: true; sentCount?: number }>;
};

export function RulesList({ rules, canEdit, canDelete, deleteAction, testAction }: Props) {
  const [confirming, setConfirming] = useState<RuleRow | null>(null);
  const [error, setError] = useState("");
  const [testFeedback, setTestFeedback] = useState<{ ruleId: string; message: string; ok: boolean } | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  function handleTest(ruleId: string) {
    setTestFeedback(null);
    setTestingId(ruleId);
    start(async () => {
      const res = await testAction(ruleId);
      if (res.ok) {
        setTestFeedback({ ruleId, message: `已發送測試通知到 ${res.sentCount} 人`, ok: true });
      } else {
        setTestFeedback({ ruleId, message: res.error ?? "發送失敗", ok: false });
      }
      setTestingId(null);
      setTimeout(() => setTestFeedback(null), 3000);
    });
  }

  function handleDelete() {
    if (!confirming) return;
    setError("");
    start(async () => {
      const res = await deleteAction(confirming.id);
      if (res && "error" in res && res.error) { setError(res.error); return; }
      setConfirming(null);
    });
  }

  if (rules.length === 0) {
    return (
      <div className="rounded-2xl bg-surface py-12 text-center text-sm text-on-surface-variant ring-1 ring-outline-variant">
        尚無通知規則。點右上「+ 新增規則」建立第一條。
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-outline-variant">
        <table className="w-full">
          <thead className="bg-surface-container-high text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
            <tr>
              <th className="px-6 py-3">事件</th>
              <th className="px-6 py-3">標題</th>
              <th className="px-6 py-3">通道</th>
              <th className="px-6 py-3">收件人</th>
              <th className="px-6 py-3">狀態</th>
              <th className="px-6 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
            {rules.map((r) => (
              <tr key={r.id} className="hover:bg-surface-container/50">
                <td className="px-6 py-3">
                  <div className="font-medium">{r.eventDisplayName}</div>
                  {r.eventType === "SCHEDULED" && r.daysOffset != null && (
                    <div className="text-xs text-on-surface-variant">
                      {r.daysOffset > 0
                        ? `提前 ${r.daysOffset} 天`
                        : r.daysOffset < 0
                        ? `延後 ${-r.daysOffset} 天`
                        : "當天"}
                    </div>
                  )}
                </td>
                <td className="px-6 py-3 text-on-surface">{r.title}</td>
                <td className="px-6 py-3 text-on-surface-variant">
                  <div className="flex flex-wrap gap-1">
                    {r.emailEnabled && (
                      <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs">📧 Email</span>
                    )}
                    {r.inAppEnabled && (
                      <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs">🔔 系統內</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3 text-on-surface-variant">{r.recipientCount} 人</td>
                <td className="px-6 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.enabled
                        ? "bg-status-rented/12 text-status-rented"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {r.enabled ? "啟用" : "停用"}
                  </span>
                </td>
                <td className="px-6 py-3 text-right whitespace-nowrap">
                  {canEdit && r.enabled && r.inAppEnabled && (
                    <button
                      onClick={() => handleTest(r.id)}
                      disabled={testingId === r.id && isPending}
                      className="rounded-full px-3 py-1 text-sm text-on-surface-variant hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
                      title="立即發送一次測試通知到所有收件人"
                    >
                      {testingId === r.id && isPending ? "發送中…" : "測試"}
                    </button>
                  )}
                  {canEdit && (
                    <Link
                      href={`/settings/notifications/rules/${r.id}/edit`}
                      className="ml-1 rounded-full px-3 py-1 text-sm text-primary hover:bg-primary/8"
                    >
                      編輯
                    </Link>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => { setError(""); setConfirming(r); }}
                      className="ml-1 rounded-full px-3 py-1 text-sm text-error hover:bg-error/8"
                    >
                      刪除
                    </button>
                  )}
                  {testFeedback?.ruleId === r.id && (
                    <div className={`mt-1 text-xs ${testFeedback.ok ? "text-status-rented" : "text-error"}`}>
                      {testFeedback.message}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirming(null); }}
        >
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl ring-1 ring-outline-variant">
            <h2 className="mb-2 text-xl font-medium text-on-surface">確認刪除規則</h2>
            <p className="text-sm text-on-surface-variant">
              要刪除「<strong className="text-on-surface">{confirming.title}</strong>」嗎？此操作無法復原。
            </p>
            {error && <p className="mt-2 text-sm text-error">{error}</p>}
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outlined" type="button" onClick={() => setConfirming(null)}>取消</Button>
              <Button variant="danger" onClick={handleDelete} disabled={isPending}>
                {isPending ? "刪除中…" : "確認刪除"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
