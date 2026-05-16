"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Props = {
  unitId: string;
  unitNumber: string;
  contractCount: number;
  propertyId: string;
  deleteAction: (id: string) => Promise<{ error?: string }>;
};

export function UnitDeleteButton({ unitId, unitNumber, contractCount, propertyId, deleteAction }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();

  function handleDelete() {
    start(async () => {
      const res = await deleteAction(unitId);
      if (res?.error) { setError(res.error); return; }
      setOpen(false);
      router.push(`/properties/${propertyId}`);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => { setError(""); setOpen(true); }}
        className="rounded-full px-4 py-2 text-sm font-medium text-error hover:bg-error/8"
      >
        刪除房間
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl ring-1 ring-outline-variant">
            <h2 className="mb-2 text-xl font-medium text-on-surface">確認刪除房間</h2>
            <p className="text-sm text-on-surface-variant">
              確定要刪除房號 <strong className="text-on-surface">「{unitNumber}」</strong> 嗎？此動作無法復原。
            </p>
            {contractCount > 0 && (
              <p className="mt-2 text-sm text-error">
                此房間有 {contractCount} 份合約紀錄，無法刪除。
              </p>
            )}
            {error && <p className="mt-2 text-sm text-error">{error}</p>}
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outlined" type="button" onClick={() => setOpen(false)}>取消</Button>
              <Button variant="danger" onClick={handleDelete} disabled={isPending || contractCount > 0}>
                {isPending ? "刪除中…" : "確認刪除"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
