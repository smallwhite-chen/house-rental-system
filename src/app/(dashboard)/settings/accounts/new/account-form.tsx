"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import {
  createAccountAction,
  type CreateAccountState,
} from "../actions";

/**
 * 注意：state.values 用來保留使用者輸入。
 * React 19 在 form action 結束後會自動 reset 表單，沒有這個機制使用者每次填錯都會被清空。
 * 密碼不放進 values（安全考量）— 錯誤時使用者需重新輸入密碼。
 */
const INITIAL_STATE: CreateAccountState = {
  error: null,
  fieldErrors: {},
  success: false,
  values: {
    name: "",
    email: "",
    roleId: "",
    status: "ACTIVE",
    note: "",
  },
};

export function NewAccountForm({
  roles,
}: {
  roles: ReadonlyArray<{ id: string; name: string; isSystem: boolean }>;
}) {
  const [state, formAction, pending] = useActionState<
    CreateAccountState,
    FormData
  >(createAccountAction, INITIAL_STATE);

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

      <FormField label="姓名" htmlFor="name" required error={state.fieldErrors.name}>
        <TextInput id="name" name="name" defaultValue={v.name} disabled={pending} error={Boolean(state.fieldErrors.name)} />
      </FormField>

      <FormField label="Email" htmlFor="email" required helper="作為登入帳號" error={state.fieldErrors.email}>
        <TextInput id="email" name="email" type="email" defaultValue={v.email} autoComplete="off" disabled={pending} error={Boolean(state.fieldErrors.email)} />
      </FormField>

      <FormField
        label="初始密碼"
        htmlFor="password"
        required
        helper="最少 8 碼，需含大小寫英文 + 數字（為了安全，錯誤時不會回填）"
        error={state.fieldErrors.password}
      >
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          disabled={pending}
          error={Boolean(state.fieldErrors.password)}
        />
      </FormField>

      <FormField label="角色" htmlFor="roleId" required error={state.fieldErrors.roleId}>
        <Select
          id="roleId"
          name="roleId"
          defaultValue={v.roleId}
          disabled={pending}
          error={Boolean(state.fieldErrors.roleId)}
          options={[
            { value: "", label: "— 請選擇 —" },
            ...roleOptions,
          ]}
        />
      </FormField>

      <FormField label="狀態" htmlFor="status" required>
        <Select
          id="status"
          name="status"
          defaultValue={v.status || "ACTIVE"}
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
          <Button type="button" variant="outlined" disabled={pending}>取消</Button>
        </Link>
        <Button type="submit" variant="filled" disabled={pending}>
          {pending ? "建立中..." : "建立帳號"}
        </Button>
      </div>
    </form>
  );
}
