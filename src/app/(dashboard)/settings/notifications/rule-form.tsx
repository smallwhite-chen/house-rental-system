"use client";
import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import type {
  NotificationEventKey,
  NotificationEventType,
} from "@/generated/prisma/client";

export type EventTemplateOption = {
  eventKey: NotificationEventKey;
  eventType: NotificationEventType;
  displayName: string;
};

export type UserOption = { id: string; name: string; email: string };

export type RuleFormInitial = {
  eventKey?: NotificationEventKey;
  daysOffset?: number | null;
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
  title?: string;
  body?: string;
  enabled?: boolean;
  recipientIds?: string[];
};

type Props = {
  events: EventTemplateOption[];
  users: UserOption[];
  initial?: RuleFormInitial;
  submitLabel: string;
  onSubmit: (fd: FormData) => Promise<{ error?: string; ok?: true; id?: string }>;
  nextPath?: string;
};

export function RuleForm({
  events,
  users,
  initial = {},
  submitLabel,
  onSubmit,
  nextPath,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();

  const [eventKey, setEventKey] = useState<NotificationEventKey | "">(initial.eventKey ?? "");
  const [recipientIds, setRecipientIds] = useState<Set<string>>(
    new Set(initial.recipientIds ?? [])
  );
  const [bodyLen, setBodyLen] = useState((initial.body ?? "").length);

  const selectedEvent = useMemo(
    () => events.find((e) => e.eventKey === eventKey),
    [events, eventKey]
  );
  const needsDaysOffset = selectedEvent?.eventType === "SCHEDULED";

  function toggleRecipient(id: string) {
    setRecipientIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    // 補上 recipientIds（從 set 帶入）
    for (const id of recipientIds) {
      fd.append("recipientIds", id);
    }
    start(async () => {
      const res = await onSubmit(fd);
      if (res?.error) { setError(res.error); return; }
      const target = res?.id ? "/settings/notifications" : nextPath ?? "/settings/notifications";
      router.push(target);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="text-lg font-medium text-on-surface">事件與時機</h2>

        <FormField label="觸發事件" htmlFor="eventKey" required>
          <Select
            id="eventKey"
            name="eventKey"
            value={eventKey}
            onChange={(e) => setEventKey(e.target.value as NotificationEventKey)}
            required
            options={[
              { value: "", label: "— 請選擇 —" },
              ...events.map((ev) => ({
                value: ev.eventKey,
                label: `${ev.displayName} ${ev.eventType === "SCHEDULED" ? "⏰" : "⚡"}`,
              })),
            ]}
          />
        </FormField>

        {needsDaysOffset && (
          <FormField
            label="提前 / 延後天數"
            htmlFor="daysOffset"
            required
            helper="正值＝提前 N 天觸發；負值＝延後 N 天觸發"
          >
            <TextInput
              id="daysOffset"
              name="daysOffset"
              type="number"
              step="1"
              defaultValue={initial.daysOffset ?? 0}
              required
            />
          </FormField>
        )}
      </section>

      <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="text-lg font-medium text-on-surface">通知管道（至少 1 個）</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-3 text-sm text-on-surface">
            <input
              type="checkbox"
              name="emailEnabled"
              defaultChecked={initial.emailEnabled ?? true}
              className="h-4 w-4 rounded border-outline accent-primary"
            />
            <span>📧 Email 通知</span>
          </label>
          <label className="flex items-center gap-3 text-sm text-on-surface">
            <input
              type="checkbox"
              name="inAppEnabled"
              defaultChecked={initial.inAppEnabled ?? false}
              className="h-4 w-4 rounded border-outline accent-primary"
            />
            <span>🔔 系統內通知</span>
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <div>
          <h2 className="text-lg font-medium text-on-surface">通知對象（至少 1 個）</h2>
          <p className="text-sm text-on-surface-variant">已選 {recipientIds.size} 人</p>
        </div>
        {users.length === 0 ? (
          <p className="text-sm text-error">尚無可用帳號</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {users.map((u) => {
              const selected = recipientIds.has(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleRecipient(u.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    selected
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {selected && <CheckIcon />}
                  {u.name}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="text-lg font-medium text-on-surface">通知內容</h2>
        <FormField label="標題" htmlFor="title" required>
          <TextInput
            id="title"
            name="title"
            defaultValue={initial.title ?? ""}
            placeholder="例如：合約即將到期通知"
            required
          />
        </FormField>
        <FormField label="內容" htmlFor="body" required helper={`${bodyLen} / 500`}>
          <textarea
            id="body"
            name="body"
            rows={4}
            maxLength={500}
            defaultValue={initial.body ?? ""}
            onChange={(e) => setBodyLen(e.target.value.length)}
            placeholder="可用一般文字描述。未來會支援變數（如房客姓名）。"
            className="block w-full rounded-lg border-0 bg-surface px-4 py-3 text-on-surface ring-1 ring-inset ring-outline placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            required
          />
        </FormField>

        <label className="flex items-center gap-3 text-sm text-on-surface">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={initial.enabled ?? true}
            className="h-4 w-4 rounded border-outline accent-primary"
          />
          <span>啟用此規則</span>
        </label>
      </section>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button variant="outlined" type="button" onClick={() => router.back()}>取消</Button>
        <Button variant="filled" type="submit" disabled={isPending}>
          {isPending ? "儲存中…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
    </svg>
  );
}
