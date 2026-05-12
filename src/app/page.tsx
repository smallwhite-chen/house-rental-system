import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * 根路徑：依登入狀態導向。
 * - 已登入 → /dashboard
 * - 未登入 → /signin
 */
export default async function RootPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  redirect("/signin");
}
