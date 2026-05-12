"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

/**
 * 登入 Server Action — 配合 useActionState 使用。
 *
 * NextAuth v5 在 signIn() 成功且帶 redirectTo 時會丟出 NEXT_REDIRECT 錯誤，
 * 由 Next.js 攔截並完成導向；本函式只攔截 AuthError，其他錯誤（含 redirect）原樣 re-throw。
 *
 * 錯誤訊息合併處理：
 * - 帳號錯誤、密碼錯誤、帳號停用（auth.ts authorize 返回 null）統一回「帳號或密碼錯誤」，
 *   避免揭露「該 email 是否存在」此類資訊（避免帳號列舉攻擊）。
 * - 帳號停用後的解鎖 Email 流程，Phase 2.5 帳號管理一併實作。
 */

export type SignInState = {
  error: string | null;
};

export async function signInAction(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "請輸入 Email 與密碼" };
  }
  if (!email || !password) {
    return { error: "請輸入 Email 與密碼" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
    return { error: null }; // 不會到這行：成功時 signIn() 會丟 redirect
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "帳號或密碼錯誤" };
        default:
          return { error: "登入失敗，請稍後再試" };
      }
    }
    throw error; // 把 NEXT_REDIRECT 等丟回去讓 Next.js 處理
  }
}
