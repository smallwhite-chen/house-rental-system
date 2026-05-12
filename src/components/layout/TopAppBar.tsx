import Link from "next/link";
import { UserMenu } from "./UserMenu";

/**
 * Top App Bar — 高 56px (h-14)。
 *
 * 左側：Logo + 公司名稱（CompanySettings.companyName 或 fallback）
 * 右側：（未來）通知鈴鐺、UserMenu
 *
 * 由 (dashboard)/layout.tsx 渲染並從 session/db 取得使用者資料後傳入。
 */
export function TopAppBar({
  companyName,
  user,
}: {
  companyName: string;
  user: { name: string; email: string; roleName: string };
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-outline-variant bg-surface px-6">
      <Link
        href="/dashboard"
        className="flex items-center gap-3 transition-opacity hover:opacity-80"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.06l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 0 0 1.061 1.06l8.69-8.69Z" />
            <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.43Z" />
          </svg>
        </div>
        <span className="text-base font-medium text-on-surface">{companyName}</span>
      </Link>

      <UserMenu name={user.name} email={user.email} roleName={user.roleName} />
    </header>
  );
}
