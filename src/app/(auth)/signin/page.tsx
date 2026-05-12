import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "登入 ｜ 房屋租賃管理系統",
};

/**
 * Phase 0 placeholder。
 * Phase 2「系統設定 / 帳號管理」會回頭把 Credentials 登入 form、
 * OAuth 按鈕（依環境變數啟用）、忘記密碼連結等實作完整。
 */
export default function SignInPage() {
  return (
    <div className="rounded-2xl bg-surface p-8 shadow-sm ring-1 ring-outline-variant">
      <h1 className="text-2xl font-medium text-on-surface">登入</h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        房屋租賃管理系統 — 公司管理者登入
      </p>
      <div className="mt-6 rounded-xl bg-surface-container p-6 text-sm text-on-surface-variant">
        登入頁尚未實作（Phase 2 帳號管理會完成此頁面）。
      </div>
    </div>
  );
}
