import type { ReactNode } from "react";

/**
 * (auth) route group layout
 * 路由群組（括號）不會出現在 URL 中，例如 /signin、/signout。
 * 此 layout 套用於所有「未登入」可見的頁面。
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-container px-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
