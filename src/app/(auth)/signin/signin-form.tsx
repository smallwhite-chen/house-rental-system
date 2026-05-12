"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { FormField } from "@/components/ui/FormField";
import { signInAction, type SignInState } from "./actions";

const INITIAL_STATE: SignInState = { error: null };

/**
 * 登入表單（Client Component）。
 *
 * 使用 React 19 的 useActionState 同時處理：
 *   - 表單提交（呼叫 signInAction）
 *   - 錯誤訊息顯示（state.error）
 *   - 提交中狀態（pending）
 *
 * OAuth 按鈕只在環境變數有設定時顯示（從 page.tsx 透過 props 傳入）。
 */
export function SignInForm({
  oauthEnabled,
}: {
  oauthEnabled: { google: boolean; github: boolean };
}) {
  const [state, formAction, pending] = useActionState(signInAction, INITIAL_STATE);
  const hasOAuth = oauthEnabled.google || oauthEnabled.github;

  return (
    <div className="space-y-6">
      {state.error && (
        <div
          role="alert"
          className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container"
        >
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <FormField label="Email" htmlFor="email" required>
          <TextInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            disabled={pending}
            error={Boolean(state.error)}
          />
        </FormField>

        <FormField label="密碼" htmlFor="password" required>
          <TextInput
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="輸入密碼"
            disabled={pending}
            error={Boolean(state.error)}
          />
        </FormField>

        <div className="pt-2">
          <Button type="submit" variant="filled" fullWidth disabled={pending}>
            {pending ? "登入中..." : "登入"}
          </Button>
        </div>
      </form>

      {hasOAuth && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-outline-variant" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-3 text-on-surface-variant">
                或使用其他方式登入
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {oauthEnabled.google && (
              <Button
                type="button"
                variant="outlined"
                fullWidth
                onClick={() => {
                  // 直接導向 NextAuth 的 OAuth callback URL
                  window.location.href = "/api/auth/signin/google";
                }}
              >
                使用 Google 登入
              </Button>
            )}
            {oauthEnabled.github && (
              <Button
                type="button"
                variant="outlined"
                fullWidth
                onClick={() => {
                  window.location.href = "/api/auth/signin/github";
                }}
              >
                使用 GitHub 登入
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
