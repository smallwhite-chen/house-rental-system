"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { FormField } from "@/components/ui/FormField";

type Props = {
  initial: {
    emailSenderName: string;
    emailSenderAddress: string;
    emailEnabled: boolean;
    inAppEnabled: boolean;
  };
  disabled: boolean;
  onSubmit: (fd: FormData) => Promise<{ error?: string; ok?: true }>;
};

export function ChannelForm({ initial, disabled, onSubmit }: Props) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await onSubmit(fd);
      if (res?.error) { setError(res.error); return; }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Email 寄件者名稱" htmlFor="emailSenderName" required>
          <TextInput
            id="emailSenderName"
            name="emailSenderName"
            defaultValue={initial.emailSenderName}
            placeholder="例如：裕一開發股份有限公司"
            disabled={disabled}
            required
          />
        </FormField>
        <FormField label="Email 寄件者 Email" htmlFor="emailSenderAddress" required>
          <TextInput
            id="emailSenderAddress"
            name="emailSenderAddress"
            type="email"
            defaultValue={initial.emailSenderAddress}
            placeholder="noreply@example.com"
            disabled={disabled}
            required
          />
        </FormField>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-3 text-sm text-on-surface">
          <input
            type="checkbox"
            name="emailEnabled"
            defaultChecked={initial.emailEnabled}
            disabled={disabled}
            className="h-4 w-4 rounded border-outline accent-primary"
          />
          <span>📧 啟用 Email 通知</span>
        </label>
        <label className="flex items-center gap-3 text-sm text-on-surface">
          <input
            type="checkbox"
            name="inAppEnabled"
            defaultChecked={initial.inAppEnabled}
            disabled={disabled}
            className="h-4 w-4 rounded border-outline accent-primary"
          />
          <span>🔔 啟用系統內通知</span>
        </label>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}
      {success && <p className="text-sm text-status-rented">✓ 已儲存</p>}

      {!disabled && (
        <div className="flex justify-end">
          <Button variant="filled" type="submit" disabled={isPending}>
            {isPending ? "儲存中…" : "儲存通道設定"}
          </Button>
        </div>
      )}
    </form>
  );
}
