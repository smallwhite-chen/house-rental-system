import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "權限不足 ｜ 房屋租賃管理系統",
};

/**
 * 403 / 權限不足頁面。
 *
 * 由 requirePermission() 在權限檢查失敗時 redirect 至此。
 * 放在 (dashboard) 之內，會帶上 TopAppBar + Sidebar，使用者可直接導去其他頁面。
 */
export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-2xl bg-surface p-8 text-center ring-1 ring-outline-variant">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-error-container">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-7 w-7 text-on-error-container"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-medium text-on-surface">權限不足</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          你目前的角色沒有此頁的存取權限。如需使用，請聯絡系統管理者調整角色設定。
        </p>
        <div className="mt-6">
          <Link href="/dashboard">
            <Button variant="filled">回到 Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
