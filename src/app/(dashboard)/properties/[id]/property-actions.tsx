"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

type Props = {
  propertyId: string;
  propertyName: string;
  unitCount: number;
  canEdit: boolean;
  canDelete: boolean;
  deleteAction: (id: string) => Promise<{ error?: string }>;
};

export function PropertyActions({ propertyId, propertyName, unitCount, canEdit, canDelete, deleteAction }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();

  function handleDelete() {
    start(async () => {
      const res = await deleteAction(propertyId);
      if (res?.error) { setError(res.error); return; }
      setConfirming(false);
      router.push("/properties");
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex gap-2">
        {canEdit && (
          <Link
            href={`/properties/${propertyId}/edit`}
            className="rounded-full bg-secondary-container px-4 py-2 text-sm font-medium text-on-secondary-container hover:bg-secondary-container/80"
          >
            編輯
          </Link>
        )}
        {canDelete && (
          <button
            onClick={() => { setError(""); setConfirming(true); }}
            className="rounded-full px-4 py-2 text-sm font-medium text-error hover:bg-error/8"
          >
            刪除
          </button>
        )}
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) setConfirming(false); }}>
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl ring-1 ring-outline-variant">
            <h2 className="mb-2 text-xl font-medium text-on-surface">確認刪除房產</h2>
            <p className="text-sm text-on-surface-variant">
              確定要刪除 <strong className="text-on-surface">「{propertyName}」</strong> 嗎？此動作無法復原。
            </p>
            {unitCount > 0 && (
              <p className="mt-2 text-sm text-error">
                此房產目前有 {unitCount} 間房間，無法刪除，請先刪除所有房間。
              </p>
            )}
            {error && <p className="mt-2 text-sm text-error">{error}</p>}
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outlined" type="button" onClick={() => setConfirming(false)}>取消</Button>
              <Button variant="danger" onClick={handleDelete} disabled={isPending || unitCount > 0}>
                {isPending ? "刪除中…" : "確認刪除"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
