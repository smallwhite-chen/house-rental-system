import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/lib/rbac";
import { SignInForm } from "./signin-form";

export const metadata: Metadata = {
  title: "登入 ｜ 房屋租賃管理系統",
};

/**
 * 登入頁（Server Component）。
 *
 * - 已登入則直接 redirect 到 /dashboard
 * - OAuth provider 啟用狀態於伺服器端讀取，傳給 client form
 *   （避免將 process.env 暴露到 client bundle）
 */
export default async function SignInPage() {
  // 用 getCurrentUserContext 而非 auth()：前者會檢查 DB 狀態，
  // 對於 session 仍有效但 User.status = DISABLED 的情況回傳 null，
  // 避免 dashboard layout 把 disabled 使用者導回 /signin 後又被導去 /dashboard 形成迴圈。
  const ctx = await getCurrentUserContext();
  if (ctx) {
    redirect("/dashboard");
  }

  const oauthEnabled = {
    google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    github: Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET),
  };

  return (
    <div className="rounded-2xl bg-surface p-8 shadow-md ring-1 ring-outline-variant/50">
      <div className="mb-8 flex items-center gap-3">
        {/* Logo */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.06l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 0 0 1.061 1.06l8.69-8.69Z" />
            <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.43Z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-medium text-on-surface">房屋租賃管理系統</h1>
          <p className="text-sm text-on-surface-variant">公司管理者登入</p>
        </div>
      </div>

      <SignInForm oauthEnabled={oauthEnabled} />
    </div>
  );
}
