"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { FormField } from "@/components/ui/FormField";
import { PermissionMatrix } from "../PermissionMatrix";
import type { ModuleKey, PermissionAction } from "@/generated/prisma/client";

type Permission = { module: ModuleKey; action: PermissionAction };

type Props = {
  roleId: string;
  initialName: string;
  initialDescription: string;
  initialPermissions: Permission[];
  updateAction: (id: string, fd: FormData) => Promise<{ error?: string }>;
};

export function EditRoleForm({ roleId, initialName, initialDescription, initialPermissions, updateAction }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await updateAction(roleId, fd);
      if (res?.error) { setError(res.error); return; }
      router.push("/settings/roles");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant space-y-4">
        <h2 className="text-lg font-medium text-on-surface">基本資料</h2>
        <FormField label="角色名稱" htmlFor="name" required>
          <TextInput id="name" name="name" defaultValue={initialName} required />
        </FormField>
        <FormField label="說明" htmlFor="description">
          <TextInput id="description" name="description" defaultValue={initialDescription} placeholder="選填" />
        </FormField>
      </div>

      <div className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant space-y-4">
        <div>
          <h2 className="text-lg font-medium text-on-surface">權限設定</h2>
          <p className="text-sm text-on-surface-variant">勾選此角色可以執行的操作。</p>
        </div>
        <PermissionMatrix initialPermissions={initialPermissions} />
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button variant="outlined" type="button" onClick={() => router.push("/settings/roles")}>取消</Button>
        <Button variant="filled" type="submit" disabled={isPending}>
          {isPending ? "儲存中…" : "儲存變更"}
        </Button>
      </div>
    </form>
  );
}
