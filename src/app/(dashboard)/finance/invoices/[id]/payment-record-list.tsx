"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";

type PaymentRow = {
  id: string;
  paymentDate: string;
  amount: number;
  method: string;
  note: string | null;
};

type Props = {
  invoiceId: string;
  records: PaymentRow[];
  canDelete: boolean;
  deleteAction: (id: string) => Promise<{ error?: string; ok?: true }>;
};

export function PaymentRecordList({ records, canDelete, deleteAction }: Props) {
  const [confirming, setConfirming] = useState<PaymentRow | null>(null);
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();

  function handleDelete() {
    if (!confirming) return;
    setError("");
    start(async () => {
      const res = await deleteAction(confirming.id);
      if (res?.error) { setError(res.error); return; }
      setConfirming(null);
    });
  }

  if (records.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-on-surface-variant">
        尚無收款紀錄。點上方「+ 新增收款」記錄第一筆款項。
      </p>
    );
  }

  return (
    <>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-on-surface-variant">
          <tr>
            <th className="pb-2">收款日</th>
            <th className="pb-2 text-right">金額</th>
            <th className="pb-2">收款方式</th>
            <th className="pb-2">備註</th>
            <th className="pb-2 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {records.map((p) => (
            <tr key={p.id}>
              <td className="py-2 font-mono text-xs text-on-surface-variant">{p.paymentDate}</td>
              <td className="py-2 text-right font-medium text-on-surface">
                NT$ {p.amount.toLocaleString("zh-TW", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </td>
              <td className="py-2 text-on-surface-variant">{p.method}</td>
              <td className="py-2 text-on-surface-variant">
                {p.note ?? <span className="text-outline">—</span>}
              </td>
              <td className="py-2 text-right whitespace-nowrap">
                {canDelete && (
                  <button
                    onClick={() => { setError(""); setConfirming(p); }}
                    className="rounded-full px-3 py-1 text-xs text-error hover:bg-error/8"
                  >
                    刪除
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirming(null); }}
        >
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl ring-1 ring-outline-variant">
            <h2 className="mb-2 text-xl font-medium text-on-surface">確認刪除收款紀錄</h2>
            <p className="text-sm text-on-surface-variant">
              要刪除 <strong className="text-on-surface">{confirming.paymentDate}</strong> 的
              收款紀錄（NT$ {confirming.amount.toLocaleString("zh-TW")}）嗎？
              刪除後系統會自動重算帳單狀態。
            </p>
            {error && <p className="mt-2 text-sm text-error">{error}</p>}
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outlined" type="button" onClick={() => setConfirming(null)}>取消</Button>
              <Button variant="danger" onClick={handleDelete} disabled={isPending}>
                {isPending ? "刪除中…" : "確認刪除"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
