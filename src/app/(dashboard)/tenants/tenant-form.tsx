"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { FormField } from "@/components/ui/FormField";

export type TenantFormInitial = {
  name?: string;
  idNumber?: string;
  phone?: string;
  email?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  note?: string | null;
};

type Props = {
  initial?: TenantFormInitial;
  submitLabel: string;
  onSubmit: (fd: FormData) => Promise<{ error?: string; ok?: true; id?: string }>;
  /**
   * 成功後要去的路徑。
   * - 若 server action 回傳 `id`（新增模式）→ 自動導向 `/tenants/{id}`
   * - 否則使用此 prop（編輯模式可指定 `/tenants/${id}`）
   * - 都沒設 → 回 `/tenants` 列表
   */
  nextPath?: string;
};

export function TenantForm({ initial = {}, submitLabel, onSubmit, nextPath }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [noteLen, setNoteLen] = useState((initial.note ?? "").length);
  const [isPending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await onSubmit(fd);
      if (res?.error) { setError(res.error); return; }
      const target = res?.id ? `/tenants/${res.id}` : nextPath ?? "/tenants";
      router.push(target);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="text-lg font-medium text-on-surface">基本資料</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="姓名" htmlFor="name" required>
            <TextInput id="name" name="name" defaultValue={initial.name ?? ""} required autoFocus />
          </FormField>
          <FormField label="身分證字號" htmlFor="idNumber" required helper="自動轉大寫；用於合約簽訂與身份確認">
            <TextInput
              id="idNumber"
              name="idNumber"
              defaultValue={initial.idNumber ?? ""}
              required
              maxLength={20}
              className="uppercase"
            />
          </FormField>
          <FormField label="聯絡電話" htmlFor="phone" required>
            <TextInput id="phone" name="phone" defaultValue={initial.phone ?? ""} required />
          </FormField>
          <FormField label="Email" htmlFor="email">
            <TextInput id="email" name="email" type="email" defaultValue={initial.email ?? ""} placeholder="選填" />
          </FormField>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="text-lg font-medium text-on-surface">緊急聯絡人</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="姓名" htmlFor="emergencyContactName">
            <TextInput
              id="emergencyContactName"
              name="emergencyContactName"
              defaultValue={initial.emergencyContactName ?? ""}
              placeholder="選填"
            />
          </FormField>
          <FormField label="電話" htmlFor="emergencyContactPhone">
            <TextInput
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              defaultValue={initial.emergencyContactPhone ?? ""}
              placeholder="選填"
            />
          </FormField>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="text-lg font-medium text-on-surface">備註</h2>
        <FormField label="備註" htmlFor="note" helper={`${noteLen} / 500`}>
          <textarea
            id="note"
            name="note"
            rows={4}
            maxLength={500}
            defaultValue={initial.note ?? ""}
            onChange={(e) => setNoteLen(e.target.value.length)}
            placeholder="選填，最多 500 字"
            className="block w-full rounded-lg border-0 bg-surface px-4 py-3 text-on-surface ring-1 ring-inset ring-outline placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          />
        </FormField>
      </div>

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
