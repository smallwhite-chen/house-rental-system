import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { requireUserContext } from "@/lib/rbac";

export const metadata: Metadata = {
  title: "系統設定 ｜ 房屋租賃管理系統",
};

/**
 * 系統設定 hub 頁。
 *
 * 顯示 11 個子模組卡片網格。已實作的可點進去，未實作的灰掉並標示 phase。
 *
 * 權限：所有設定模組都會自帶 requirePermission；hub 頁本身只需要登入即可，
 * 進入子頁時才會被權限攔截。
 */
export default async function SettingsHubPage() {
  await requireUserContext(); // 純登入檢查；layout 已經做過，這裡只是顯式宣告依賴
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-medium text-on-surface">系統設定</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          管理公司基本資料、權限、收款方式與各種類資料
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SETTINGS_MODULES.map((m) => (
          <SettingsCard key={m.title} module={m} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════

type SettingsModule = {
  title: string;
  description: string;
  href: string | null; // null = 尚未實作
  plannedPhase: string;
  icon: ReactNode;
};

const ICON_CLASS = "h-6 w-6";

const SETTINGS_MODULES: ReadonlyArray<SettingsModule> = [
  {
    title: "系統基本設定",
    description: "公司基本資料、貨幣、日期格式、時區",
    href: "/settings/general",
    plannedPhase: "Phase 2.4",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS} aria-hidden="true">
        <path fillRule="evenodd" d="M3 2.25a.75.75 0 0 0 0 1.5h.75v15.75H3a.75.75 0 0 0 0 1.5h18a.75.75 0 0 0 0-1.5h-.75V3.75H21a.75.75 0 0 0 0-1.5H3ZM6.75 7.5a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V7.5Zm.75 3.75a.75.75 0 0 0-.75.75v1.5c0 .414.336.75.75.75H9a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75H7.5Zm6-4.5a.75.75 0 0 0-.75.75v1.5c0 .414.336.75.75.75H15a.75.75 0 0 0 .75-.75V7.5a.75.75 0 0 0-.75-.75h-1.5ZM12 12a.75.75 0 0 1 .75-.75H15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1-.75-.75V12Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: "帳號管理",
    description: "新增、停用使用者帳號與指派角色",
    href: "/settings/accounts",
    plannedPhase: "Phase 2.5",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS} aria-hidden="true">
        <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122Z" />
      </svg>
    ),
  },
  {
    title: "角色管理",
    description: "建立自訂角色與細粒度權限設定",
    href: "/settings/roles",
    plannedPhase: "Phase 2.6",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS} aria-hidden="true">
        <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: "通知與提醒設定",
    description: "Email / 系統內通知規則、觸發事件設定",
    href: null,
    plannedPhase: "Phase 2.8（待開發）",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS} aria-hidden="true">
        <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: "收款方式管理",
    description: "銀行帳號與收款方式種類",
    href: "/settings/payment-methods",
    plannedPhase: "Phase 2.7",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS} aria-hidden="true">
        <path d="M4.5 3.75a3 3 0 0 0-3 3v.75h21v-.75a3 3 0 0 0-3-3h-15Z" />
        <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-7.5Zm-18 3.75a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: "房產種類管理",
    description: "新增、編輯房產類型（如：住宅、商辦）",
    href: "/settings/property-types",
    plannedPhase: "Phase 2.7",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS} aria-hidden="true">
        <path d="M11.584 2.376a.75.75 0 0 1 .832 0l9 6a.75.75 0 1 1-.832 1.248L12 3.901 3.416 9.624a.75.75 0 0 1-.832-1.248l9-6Z" />
        <path fillRule="evenodd" d="M20.25 10.332v9.918H21a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1 0-1.5h.75v-9.918a.75.75 0 0 1 .634-.74A49.109 49.109 0 0 1 12 9c2.59 0 5.134.202 7.616.592a.75.75 0 0 1 .634.74Zm-7.5 2.418a.75.75 0 0 0-1.5 0v6.75a.75.75 0 0 0 1.5 0v-6.75Zm3-.75a.75.75 0 0 1 .75.75v6.75a.75.75 0 0 1-1.5 0v-6.75a.75.75 0 0 1 .75-.75ZM9 12.75a.75.75 0 0 0-1.5 0v6.75a.75.75 0 0 0 1.5 0v-6.75Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: "收入種類管理",
    description: "新增、編輯收入分類",
    href: "/settings/income-types",
    plannedPhase: "Phase 2.7",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS} aria-hidden="true">
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.094a4.001 4.001 0 0 0-.78 7.633L11.25 14v3.473a2.501 2.501 0 0 1-1.476-1.601.75.75 0 0 0-1.426.473 4.002 4.002 0 0 0 2.902 2.677V19.5a.75.75 0 0 0 1.5 0v-.477a4.001 4.001 0 0 0 .78-7.634L12.75 10V6.527a2.5 2.5 0 0 1 1.476 1.6.75.75 0 1 0 1.425-.473A4.002 4.002 0 0 0 12.75 5.094V6Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: "支出種類管理",
    description: "新增、編輯支出分類",
    href: "/settings/expense-types",
    plannedPhase: "Phase 2.7",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS} aria-hidden="true">
        <path fillRule="evenodd" d="M2.25 2.25a.75.75 0 0 0 0 1.5H3v10.5a3 3 0 0 0 3 3h1.21l-1.172 3.513a.75.75 0 0 0 1.424.474l.329-.987h8.418l.33.987a.75.75 0 0 0 1.422-.474l-1.17-3.513H18a3 3 0 0 0 3-3V3.75h.75a.75.75 0 0 0 0-1.5H2.25Zm6.04 16.5.5-1.5h6.42l.5 1.5H8.29Zm7.46-12a.75.75 0 0 0-1.5 0v6a.75.75 0 0 0 1.5 0v-6Zm-3 2.25a.75.75 0 0 0-1.5 0v3.75a.75.75 0 0 0 1.5 0V9Zm-3 2.25a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0v-1.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: "設備種類管理",
    description: "管理房間配備清單可選項",
    href: "/settings/equipment-types",
    plannedPhase: "Phase 2.7",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS} aria-hidden="true">
        <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 1 1 6 0h3a.75.75 0 0 0 .75-.75V15Z" />
        <path d="M8.25 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM15.75 6.75a.75.75 0 0 0-.75.75v11.25c0 .087.015.17.042.248a3 3 0 0 1 5.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 0 0-3.732-10.104 1.837 1.837 0 0 0-1.47-.725H15.75Z" />
        <path d="M19.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
      </svg>
    ),
  },
  {
    title: "溝通標籤管理",
    description: "為溝通紀錄建立可重複使用的標籤",
    href: "/settings/communication-tags",
    plannedPhase: "Phase 2.7",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS} aria-hidden="true">
        <path fillRule="evenodd" d="M5.25 2.25a3 3 0 0 0-3 3v4.318a3 3 0 0 0 .879 2.121l9.58 9.581c.92.92 2.39 1.186 3.548.428a18.849 18.849 0 0 0 5.441-5.44c.758-1.16.492-2.629-.428-3.548l-9.58-9.581a3 3 0 0 0-2.122-.879H5.25ZM6.375 7.5a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    title: "稽核紀錄",
    description: "檢視系統操作記錄（保留 3 個月）",
    href: "/settings/audit-log",
    plannedPhase: "Phase 2.9",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={ICON_CLASS} aria-hidden="true">
        <path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875 0A.75.75 0 0 1 8.25 6h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75ZM2.625 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0ZM7.5 12a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12A.75.75 0 0 1 7.5 12Zm-4.875 5.25a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875 0a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
      </svg>
    ),
  },
];

function SettingsCard({ module }: { module: SettingsModule }) {
  const inner = (
    <>
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            module.href ? "bg-primary-container text-on-primary-container" : "bg-surface-container-high text-on-surface-variant"
          }`}
        >
          {module.icon}
        </div>
        <div className="flex-1">
          <p className="font-medium text-on-surface">{module.title}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-on-surface-variant">{module.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            module.href
              ? "bg-status-rented/12 text-status-rented"
              : "bg-surface-container-high text-on-surface-variant"
          }`}
        >
          {module.href ? "可使用" : "待開發"}
        </span>
        <span className="font-mono text-xs text-on-surface-variant">{module.plannedPhase}</span>
      </div>
    </>
  );

  if (module.href) {
    return (
      <Link
        href={module.href}
        className="block rounded-2xl bg-surface p-5 ring-1 ring-outline-variant transition-all hover:shadow-md hover:ring-primary/40"
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className="rounded-2xl bg-surface/60 p-5 ring-1 ring-outline-variant opacity-60">
      {inner}
    </div>
  );
}
