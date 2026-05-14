"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  resetPasswordAction,
  type ResetPasswordState,
} from "../actions";

const INITIAL_STATE: ResetPasswordState = {
  error: null,
  newPassword: null,
};

/**
 * 重設密碼按鈕。
 *
 * 流程：
 *   1. 點按鈕 → 跳 confirm 確認框（避免誤觸）
 *   2. 確認 → 呼叫 Server Action → 取得新密碼明碼
 *   3. 顯示在綠色 banner 中，附「複製」按鈕；只會顯示這一次
 *      （頁面 reload / 離開後就拿不到了）
 */
export function ResetPasswordButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const actionWithId = resetPasswordAction.bind(null, userId);
  const [state, formAction, pending] = useActionState<
    ResetPasswordState,
    FormData
  >(actionWithId as unknown as (state: ResetPasswordState, formData: FormData) => Promise<ResetPasswordState>, INITIAL_STATE);

  const [copied, setCopied] = useState(false);
  async function copy() {
    if (!state.newPassword) return;
    try {
      await navigator.clipboard.writeText(state.newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 忽略：使用者可手動複製
    }
  }

  return (
    <div className="space-y-3">
      {state.error && (
        <div role="alert" className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
          {state.error}
        </div>
      )}

      {state.newPassword && (
        <div className="rounded-lg bg-primary-container p-4 text-on-primary-container">
          <p className="text-sm font-medium">已重設 {userName} 的密碼</p>
          <p className="mt-1 text-xs">⚠️ 此密碼只會顯示這一次，請立即複製。</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 rounded bg-surface px-3 py-2 font-mono text-base text-on-surface ring-1 ring-outline-variant">
              {state.newPassword}
            </code>
            <Button type="button" variant="tonal" onClick={copy}>
              {copied ? "已複製" : "複製"}
            </Button>
          </div>
        </div>
      )}

      <form
        action={formAction}
        onSubmit={(e) => {
          if (!confirm(`確定要重設 ${userName} 的密碼嗎？\n原密碼將立即失效。`)) {
            e.preventDefault();
          }
        }}
      >
        <Button type="submit" variant="danger" disabled={pending}>
          {pending ? "處理中..." : "重設密碼"}
        </Button>
      </form>
    </div>
  );
}
