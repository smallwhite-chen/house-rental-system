"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export type GeneralSettingsState = {
  error: string | null;
  fieldErrors: Partial<Record<GeneralSettingsField, string>>;
  success: boolean;
};

const FIELDS = [
  "companyName",
  "taxId",
  "contactPhone",
  "contactEmail",
  "contactAddress",
  "currency",
  "dateFormat",
  "timezone",
] as const;

type GeneralSettingsField = (typeof FIELDS)[number];

/**
 * 注意：標記 "use server" 的檔案只能 export async function 與 type；
 * 不可 export 一般 const，否則在 client 端 import 會解析成 undefined。
 * 因此 INITIAL_STATE 改寫在 settings-form.tsx。
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TAX_ID_REGEX = /^\d{8}$/;

/**
 * 公司基本資料儲存 Server Action。
 *
 * 流程：
 *   1. 驗證權限（SETTINGS_GENERAL × EDIT）
 *   2. 解析並驗證 form 資料（必填、Email 格式、統編 8 碼）
 *   3. 讀取現有資料（用於 audit log 的 before 快照）
 *   4. upsert（id="singleton"，CompanySettings 永遠只有一筆）
 *   5. 寫 audit log（CREATE 或 UPDATE）
 *   6. revalidatePath 觸發頁面重新抓資料
 */
export async function saveGeneralSettingsAction(
  _prevState: GeneralSettingsState,
  formData: FormData
): Promise<GeneralSettingsState> {
  const ctx = await requirePermission("SETTINGS_GENERAL", "EDIT");

  // ─── 1. 解析 form ───────────────────────────────────────────────────
  const values = {} as Record<GeneralSettingsField, string>;
  for (const f of FIELDS) {
    const v = formData.get(f);
    values[f] = typeof v === "string" ? v.trim() : "";
  }

  // ─── 2. 驗證 ────────────────────────────────────────────────────────
  const fieldErrors: Partial<Record<GeneralSettingsField, string>> = {};

  if (!values.companyName) fieldErrors.companyName = "請填寫公司名稱";
  if (!values.taxId) {
    fieldErrors.taxId = "請填寫統一編號";
  } else if (!TAX_ID_REGEX.test(values.taxId)) {
    fieldErrors.taxId = "統一編號必須為 8 位數字";
  }
  if (!values.contactPhone) fieldErrors.contactPhone = "請填寫聯絡電話";
  if (!values.contactEmail) {
    fieldErrors.contactEmail = "請填寫聯絡 Email";
  } else if (!EMAIL_REGEX.test(values.contactEmail)) {
    fieldErrors.contactEmail = "Email 格式不正確";
  }
  if (!values.contactAddress) fieldErrors.contactAddress = "請填寫通訊地址";
  if (!values.currency) fieldErrors.currency = "請選擇貨幣";
  if (!values.dateFormat) fieldErrors.dateFormat = "請選擇日期格式";
  if (!values.timezone) fieldErrors.timezone = "請選擇時區";

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "請修正下列欄位", fieldErrors, success: false };
  }

  // ─── 3. 讀現況（給 audit log 用）───────────────────────────────────
  const before = await prisma.companySettings.findUnique({
    where: { id: "singleton" },
  });

  // ─── 4. upsert ─────────────────────────────────────────────────────
  try {
    const after = await prisma.companySettings.upsert({
      where: { id: "singleton" },
      update: values,
      create: { id: "singleton", ...values },
    });

    // ─── 5. audit log ────────────────────────────────────────────────
    await logAudit({
      userId: ctx.id,
      module: "SETTINGS_GENERAL",
      action: before ? "UPDATE" : "CREATE",
      targetType: "CompanySettings",
      targetId: "singleton",
      changes: before
        ? {
            before: companySettingsToJson(before),
            after: companySettingsToJson(after),
          }
        : { after: companySettingsToJson(after) },
    });

    // ─── 6. 觸發頁面 revalidate ──────────────────────────────────────
    revalidatePath("/settings/general");
    revalidatePath("/", "layout"); // TopAppBar 的公司名稱也會跟著更新

    return { error: null, fieldErrors: {}, success: true };
  } catch (err) {
    console.error("[settings/general] save failed", err);
    return {
      error: "儲存失敗，請稍後再試",
      fieldErrors: {},
      success: false,
    };
  }
}

/** 把 CompanySettings 轉成 audit log 友善的 JSON（剔除非業務欄位）。 */
function companySettingsToJson(
  s: {
    companyName: string;
    taxId: string;
    contactPhone: string;
    contactEmail: string;
    contactAddress: string;
    currency: string;
    dateFormat: string;
    timezone: string;
  }
): Record<string, string> {
  return {
    companyName: s.companyName,
    taxId: s.taxId,
    contactPhone: s.contactPhone,
    contactEmail: s.contactEmail,
    contactAddress: s.contactAddress,
    currency: s.currency,
    dateFormat: s.dateFormat,
    timezone: s.timezone,
  };
}
