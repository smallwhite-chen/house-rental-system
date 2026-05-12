"use server";

import { signOut } from "@/lib/auth";

/**
 * 登出 Server Action。
 *
 * 直接呼叫 NextAuth 的 signOut() 並導向 /signin。
 * NextAuth 在 server context 下會丟出 NEXT_REDIRECT 由 Next.js 處理，
 * 此函式不需要回傳任何值。
 */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/signin" });
}
