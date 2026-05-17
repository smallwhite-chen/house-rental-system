"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import type { InvoiceStatus } from "@/generated/prisma/client";

type Props = {
  invoiceId: string;
  paymentCount: number;
  status: InvoiceStatus;
  deleteAction: (id: string) => Promise<{ error?: string } | void>;
};

export function InvoiceDeleteButton({ invoiceId, paymentCount, status, deleteAction }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();

  const blockedReason =
    paymentCount > 0
      ? "已有收款紀錄"
      : status !== "UNPAID" && status !== "OVERDUE"
      ? "目前狀態不允許刪除"
      : null;

  function handleDelete() {
    setError("");
    start(async () => {
      const res = await deleteAction(invoiceId);
      if (res && "error" in res && res.error) {
        setError(res.error);
        return;
      }
    });
  }

  return (
    <>
      <button
        onClick={() => { setError(""); setOpen(true); }}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-error px-5 text-sm font-medium text-on-error shadow-sm hover:bg-error/90"
      >
        刪除
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl ring-1 ring-outline-variant">
            <h2 className="mb-2 text-xl font-medium text-on-surface">確認刪除帳單</h2>
            <p className="text-sm text-on-surface-variant">
              此操作無法復原。若日後仍需收取此期租金，可再從合約「產生本期帳單」重新建立。
            </p>
            {blockedReason && (
              <p className="mt-2 text-sm text-error">無法刪除：{blockedReason}</p>
            )}
            {error && <p className="mt-2 text-sm text-error">{error}</p>}
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outlined" onClick={() => setOpen(false)} type="button">取消</Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={isPending || !!blockedReason}
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
