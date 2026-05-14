"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import {
  saveGeneralSettingsAction,
  type GeneralSettingsState,
} from "./actions";

/**
 * useActionState 初始值。
 * 必須定義在 client 端，不能從 actions.ts（"use server"）import，
 * 因為 server-only 檔案只能 export async function。
 */
const INITIAL_STATE: GeneralSettingsState = {
  error: null,
  fieldErrors: {},
  success: false,
};

/**
 * 公司基本資料表單。
 *
 * - 受 page.tsx 傳入的 `initial` 控制初始值；若為 null（第一次設定）則欄位留空。
 * - 用 React 19 useActionState 處理：pending / 錯誤 / 成功訊息。
 * - 儲存成功後顯示綠色成功 banner，3 秒後淡去。
 */
export type GeneralSettingsInitial = {
  companyName: string;
  taxId: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  currency: string;
  dateFormat: string;
  timezone: string;
} | null;

const CURRENCY_OPTIONS = [
  { value: "TWD", label: "TWD 新台幣" },
  { value: "USD", label: "USD 美元" },
  { value: "JPY", label: "JPY 日圓" },
  { value: "CNY", label: "CNY 人民幣" },
  { value: "HKD", label: "HKD 港幣" },
];

const DATE_FORMAT_OPTIONS = [
  { value: "YYYY/MM/DD", label: "YYYY/MM/DD（2026/01/15）" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD（2026-01-15）" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY（15/01/2026）" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY（01/15/2026）" },
];

const TIMEZONE_OPTIONS = [
  { value: "UTC+8", label: "UTC+8（台北、北京、香港）" },
  { value: "UTC+9", label: "UTC+9（東京、首爾）" },
  { value: "UTC+0", label: "UTC+0（倫敦）" },
  { value: "UTC-5", label: "UTC-5（紐約）" },
  { value: "UTC-8", label: "UTC-8（洛杉磯）" },
];

const DEFAULTS = {
  currency: "TWD",
  dateFormat: "YYYY/MM/DD",
  timezone: "UTC+8",
};

export function GeneralSettingsForm({
  initial,
}: {
  initial: GeneralSettingsInitial;
}) {
  const [state, formAction, pending] = useActionState<
    GeneralSettingsState,
    FormData
  >(saveGeneralSettingsAction, INITIAL_STATE);

  // 成功訊息 3 秒後自動隱藏
  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [state.success]);

  const values = initial ?? {
    companyName: "",
    taxId: "",
    contactPhone: "",
    contactEmail: "",
    contactAddress: "",
    currency: DEFAULTS.currency,
    dateFormat: DEFAULTS.dateFormat,
    timezone: DEFAULTS.timezone,
  };

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <div
          role="alert"
          className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container"
        >
          {state.error}
        </div>
      )}
      {showSuccess && (
        <div
          role="status"
          className="rounded-lg bg-primary-container px-4 py-3 text-sm text-on-primary-container"
        >
          ✓ 已儲存
        </div>
      )}

      {/* ── 公司基本資料 ─────────────────────────────────────── */}
      <fieldset className="space-y-5">
        <legend className="text-sm font-medium uppercase tracking-wide text-on-surface-variant">
          公司基本資料
        </legend>

        <FormField
          label="公司名稱"
          htmlFor="companyName"
          required
          error={state.fieldErrors.companyName}
        >
          <TextInput
            id="companyName"
            name="companyName"
            defaultValue={values.companyName}
            disabled={pending}
            error={Boolean(state.fieldErrors.companyName)}
          />
        </FormField>

        <FormField
          label="統一編號"
          htmlFor="taxId"
          required
          helper="台灣統編 8 碼數字"
          error={state.fieldErrors.taxId}
        >
          <TextInput
            id="taxId"
            name="taxId"
            defaultValue={values.taxId}
            disabled={pending}
            error={Boolean(state.fieldErrors.taxId)}
            inputMode="numeric"
            maxLength={8}
          />
        </FormField>

        <FormField
          label="聯絡電話"
          htmlFor="contactPhone"
          required
          error={state.fieldErrors.contactPhone}
        >
          <TextInput
            id="contactPhone"
            name="contactPhone"
            type="tel"
            defaultValue={values.contactPhone}
            disabled={pending}
            error={Boolean(state.fieldErrors.contactPhone)}
          />
        </FormField>

        <FormField
          label="聯絡 Email"
          htmlFor="contactEmail"
          required
          error={state.fieldErrors.contactEmail}
        >
          <TextInput
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={values.contactEmail}
            disabled={pending}
            error={Boolean(state.fieldErrors.contactEmail)}
          />
        </FormField>

        <FormField
          label="通訊地址"
          htmlFor="contactAddress"
          required
          error={state.fieldErrors.contactAddress}
        >
          <TextInput
            id="contactAddress"
            name="contactAddress"
            defaultValue={values.contactAddress}
            disabled={pending}
            error={Boolean(state.fieldErrors.contactAddress)}
          />
        </FormField>
      </fieldset>

      {/* ── 地區與格式設定 ─────────────────────────────────── */}
      <fieldset className="space-y-5">
        <legend className="text-sm font-medium uppercase tracking-wide text-on-surface-variant">
          地區與格式設定
        </legend>

        <FormField label="貨幣" htmlFor="currency" required error={state.fieldErrors.currency}>
          <Select
            id="currency"
            name="currency"
            defaultValue={values.currency}
            disabled={pending}
            options={CURRENCY_OPTIONS}
            error={Boolean(state.fieldErrors.currency)}
          />
        </FormField>

        <FormField label="日期格式" htmlFor="dateFormat" required error={state.fieldErrors.dateFormat}>
          <Select
            id="dateFormat"
            name="dateFormat"
            defaultValue={values.dateFormat}
            disabled={pending}
            options={DATE_FORMAT_OPTIONS}
            error={Boolean(state.fieldErrors.dateFormat)}
          />
        </FormField>

        <FormField label="時區" htmlFor="timezone" required error={state.fieldErrors.timezone}>
          <Select
            id="timezone"
            name="timezone"
            defaultValue={values.timezone}
            disabled={pending}
            options={TIMEZONE_OPTIONS}
            error={Boolean(state.fieldErrors.timezone)}
          />
        </FormField>
      </fieldset>

      <div className="flex justify-end gap-3 border-t border-outline-variant pt-6">
        <Button type="submit" variant="filled" disabled={pending}>
          {pending ? "儲存中..." : "儲存"}
        </Button>
      </div>
    </form>
  );
}
