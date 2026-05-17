"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  tenantId: string;
  tenantName: string;
  contractCount: number;
  deleteAction: (id: string) => Promise<{ error?: string } | void>;
};

export function TenantDeleteButton({ tenantId, tenantName, contractCount, deleteAction }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();

  function handleDelete() {
    setError("");
    start(async () => {
      const res = await deleteAction(tenantId);
      if (res && "error" in res && res.error) {
        setError(res.error);
        return;
      }
      // 成功時 server action 會 redirect 回 /tenants
    });
  }

  return (
    <>
      <button
        onClick={() => { setError(""); setOpen(true); }}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-error px-6 text-sm font-medium text-on-error shadow-sm hover:bg-error/90"
      >
        刪除
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl ring-1 ring-outline-variant">
            <h2 className="mb-2 text-xl font-medium text-on-surface">確認刪除房客</h2>
            <p className="text-sm text-on-surface-variant">
              確定要刪除房客 <strong className="text-on-surface">「{tenantName}」</strong> 嗎？
            </p>
            {contractCount > 0 && (
              <p className="mt-2 text-sm text-error">
                此房客有 {contractCount} 份合約紀錄，無法刪除。請先處理相關合約後再試。
              </p>
            )}
            {error && <p className="mt-2 text-sm text-error">{error}</p>}
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outlined" onClick={() => setOpen(false)} type="button">取消</Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={isPending || contractCount > 0}
              >
                {isPending ? "刪除中…" : "確認刪除"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
