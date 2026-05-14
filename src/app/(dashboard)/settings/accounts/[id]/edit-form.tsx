"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import {
  updateAccountAction,
  type UpdateAccountState,
} from "../actions";

type EditAccountInitial = {
  name: string;
  email: string;
  roleId: string;
  status: "ACTIVE" | "DISABLED";
  note: string;
};

export function EditAccountForm({
  userId,
  initial,
  roles,
  isSuperAdmin,
}: {
  userId: string;
  initial: EditAccountInitial;
  roles: ReadonlyArray<{ id: string; name: string; isSystem: boolean }>;
  isSuperAdmin: boolean;
}) {
  // 初始 state 用 DB 撈出的 initial 填 values，這樣即使 React 19 reset 表單也能回到正確值
  const INITIAL_STATE: UpdateAccountState = {
    error: null,
    fieldErrors: {},
    success: false,
    values: {
      name: initial.name,
      email: initial.email,
      roleId: initial.roleId,
      status: initial.status,
      note: initial.note,
    },
  };

  // bind userId 進去 action 的第一個參數
  const actionWithId = updateAccountAction.bind(null, userId);
  const [state, formAction, pending] = useActionState<
    UpdateAccountState,
    FormData
  >(actionWithId, INITIAL_STATE);

  // 成功訊息 3 秒淡出
  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [state.success]);

  const roleOptions = roles.map((r) => ({
    value: r.id,
    label: r.isSystem ? `${r.name}（內建）` : r.name,
  }));

  const v = state.values;

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div role="alert" className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
          {state.error}
        </div>
      )}
      {showSuccess && (
        <div role="status" className="rounded-lg bg-primary-container px-4 py-3 text-sm text-on-primary-container">
          ✓ 已儲存
        </div>
      )}
      {isSuperAdmin && (
        <div className="rounded-lg bg-secondary-container px-4 py-3 text-sm text-on-secondary-container">
          這是 Super Admin 帳號。系統強制至少保留 1 個啟用中的 Super Admin。
        </div>
      )}

      <FormField label="姓名" htmlFor="name" required error={state.fieldErrors.name}>
        <TextInput id="name" name="name" defaultValue={v.name} disabled={pending} error={Boolean(state.fieldErrors.name)} />
      </FormField>

      <FormField label="Email" htmlFor="email" required error={state.fieldErrors.email}>
        <TextInput id="email" name="email" type="email" defaultValue={v.email} disabled={pending} error={Boolean(state.fieldErrors.email)} />
      </FormField>

      <FormField label="角色" htmlFor="roleId" required error={state.fieldErrors.roleId}>
        <Select
          id="roleId"
          name="roleId"
          defaultValue={v.roleId}
          disabled={pending}
          error={Boolean(state.fieldErrors.roleId)}
          options={roleOptions}
        />
      </FormField>

      <FormField label="狀態" htmlFor="status" required>
        <Select
          id="status"
          name="status"
          defaultValue={v.status}
          disabled={pending}
          options={[
            { value: "ACTIVE", label: "啟用" },
            { value: "DISABLED", label: "停用" },
          ]}
        />
      </FormField>

      <FormField label="備註" htmlFor="note">
        <textarea
          id="note"
          name="note"
          rows={3}
          defaultValue={v.note}
          disabled={pending}
          className="block w-full rounded-lg border-0 bg-surface px-4 py-3 text-on-surface ring-1 ring-inset ring-outline placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
        />
      </FormField>

      <div className="flex justify-end gap-3 border-t border-outline-variant pt-6">
        <Link href="/settings/accounts">
          <Button type="button" variant="outlined" disabled={pending}>返回列表</Button>
        </Link>
        <Button type="submit" variant="filled" disabled={pending}>
          {pending ? "儲存中..." : "儲存"}
        </Button>
      </div>
    </form>
  );
}
