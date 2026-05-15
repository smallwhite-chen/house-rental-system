"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  roleId: string;
  roleName: string;
  userCount: number;
  deleteAction: (id: string) => Promise<{ error?: string }>;
};

export function RolesClient({ roleId, roleName, userCount, deleteAction }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();

  function handleDelete() {
    start(async () => {
      const res = await deleteAction(roleId);
      if (res?.error) { setError(res.error); return; }
      setOpen(false);
    });
  }

  return (
    <>
      <button
        className="rounded-full px-3 py-1 text-sm text-error hover:bg-error/8"
        onClick={() => { setError(""); setOpen(true); }}
      >
        刪除
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl ring-1 ring-outline-variant">
            <h2 className="mb-2 text-xl font-medium text-on-surface">確認刪除角色</h2>
            <p className="text-sm text-on-surface-variant">
              確定要刪除角色 <strong className="text-on-surface">「{roleName}」</strong> 嗎？
            </p>
            {userCount > 0 && (
              <p className="mt-2 text-sm text-error">
                此角色目前有 {userCount} 個帳號使用中，無法刪除。
              </p>
            )}
            {error && <p className="mt-2 text-sm text-error">{error}</p>}
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outlined" onClick={() => setOpen(false)} type="button">取消</Button>
              <Button variant="danger" onClick={handleDelete} disabled={isPending || userCount > 0}>
                {isPending ? "刪除中…" : "確認刪除"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
