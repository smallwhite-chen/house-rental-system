import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { GeneralSettingsForm } from "./settings-form";

export const metadata: Metadata = {
  title: "系統基本設定 ｜ 房屋租賃管理系統",
};

/**
 * 系統基本設定頁（SPEC §3.1）。
 *
 * 權限：SETTINGS_GENERAL × VIEW（Super Admin 自動放行）。
 * 編輯／儲存的權限檢查在 Server Action 內（SETTINGS_GENERAL × EDIT）。
 */
export default async function GeneralSettingsPage() {
  await requirePermission("SETTINGS_GENERAL", "VIEW");

  const settings = await prisma.companySettings.findUnique({
    where: { id: "singleton" },
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li>
            <Link href="/settings" className="hover:text-on-surface hover:underline">
              系統設定
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">系統基本設定</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">系統基本設定</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          設定公司基本資料、貨幣、日期格式與時區
        </p>
      </header>

      <div className="rounded-2xl bg-surface p-8 ring-1 ring-outline-variant">
        <GeneralSettingsForm
          initial={
            settings
              ? {
                  companyName: settings.companyName,
                  taxId: settings.taxId,
                  contactPhone: settings.contactPhone,
                  contactEmail: settings.contactEmail,
                  contactAddress: settings.contactAddress,
                  currency: settings.currency,
                  dateFormat: settings.dateFormat,
                  timezone: settings.timezone,
                }
              : null
          }
        />
      </div>
    </div>
  );
}
