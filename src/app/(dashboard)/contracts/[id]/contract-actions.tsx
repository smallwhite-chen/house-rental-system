"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import type { ContractStatus } from "@/generated/prisma/client";

type Action = "terminate" | "complete" | "delete";

const ACTION_LABEL: Record<Action, string> = {
  terminate: "終止合約",
  complete: "完成合約",
  delete: "刪除合約",
};

const ACTION_DESC: Record<Action, string> = {
  terminate: "標記為「已終止」（提前解約）。原房間將恢復可用。",
  complete: "標記為「已完成」（正常退租）。原房間將恢復可用。",
  delete: "永久刪除合約（含設備清單、租金條件）。僅當尚未產生任何帳單時可執行。",
};

type Props = {
  contractId: string;
  currentStatus: ContractStatus;
  canEdit: boolean;
  canDelete: boolean;
  invoiceCount: number;
  terminateAction: (id: string) => Promise<{ error?: string; ok?: true }>;
  completeAction: (id: string) => Promise<{ error?: string; ok?: true }>;
  deleteAction: (id: string) => Promise<{ error?: string } | void>;
};

export function ContractActionButtons({
  contractId,
  currentStatus,
  canEdit,
  canDelete,
  invoiceCount,
  terminateAction,
  completeAction,
  deleteAction,
}: Props) {
  const [dialog, setDialog] = useState<Action | null>(null);
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();

  const canManualStatus = currentStatus !== "TERMINATED" && currentStatus !== "COMPLETED";

  function run(action: Action) {
    setError("");
    start(async () => {
      let res;
      if (action === "terminate") res = await terminateAction(contractId);
      else if (action === "complete") res = await completeAction(contractId);
      else res = await deleteAction(contractId);
      if (res && "error" in res && res.error) {
        setError(res.error);
        return;
      }
      setDialog(null);
    });
  }

  return (
    <>
      {canEdit && canManualStatus && (
        <>
          <button
            onClick={() => { setError(""); setDialog("terminate"); }}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-status-overdue/12 px-5 text-sm font-medium text-status-overdue hover:bg-status-overdue/20"
          >
            終止合約
          </button>
          <button
            onClick={() => { setError(""); setDialog("complete"); }}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-status-completed/12 px-5 text-sm font-medium text-status-completed hover:bg-status-completed/20"
          >
            完成合約
          </button>
        </>
      )}
      {canDelete && (
        <button
          onClick={() => { setError(""); setDialog("delete"); }}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-error px-5 text-sm font-medium text-on-error shadow-sm hover:bg-error/90"
        >
          刪除
        </button>
      )}

      {dialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setDialog(null); }}
        >
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl ring-1 ring-outline-variant">
            <h2 className="mb-2 text-xl font-medium text-on-surface">確認{ACTION_LABEL[dialog]}</h2>
            <p className="text-sm text-on-surface-variant">{ACTION_DESC[dialog]}</p>
            {dialog === "delete" && invoiceCount > 0 && (
              <p className="mt-2 text-sm text-error">
                此合約已產生 {invoiceCount} 張帳單，無法刪除。
              </p>
            )}
            {error && <p className="mt-2 text-sm text-error">{error}</p>}
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outlined" onClick={() => setDialog(null)} type="button">取消</Button>
              <Button
                variant={dialog === "delete" ? "danger" : "filled"}
                onClick={() => run(dialog)}
                disabled={isPending || (dialog === "delete" && invoiceCount > 0)}
              >
                {isPending ? "處理中…" : `確認${ACTION_LABEL[dialog]}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
