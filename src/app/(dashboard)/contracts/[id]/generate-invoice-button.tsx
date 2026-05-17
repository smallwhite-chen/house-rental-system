"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Props = {
  contractId: string;
  generateAction: (
    contractId: string
  ) => Promise<{ ok?: true; id?: string; error?: string; duplicateId?: string }>;
};

export function GenerateInvoiceButton({ contractId, generateAction }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [duplicateId, setDuplicateId] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  function handleGenerate() {
    setError("");
    setDuplicateId(null);
    start(async () => {
      const res = await generateAction(contractId);
      if (res.ok && res.id) {
        router.push(`/finance/invoices/${res.id}`);
        return;
      }
      setError(res.error ?? "建立失敗");
      if (res.duplicateId) setDuplicateId(res.duplicateId);
    });
  }

  return (
    <>
      <button
        onClick={() => { setError(""); setDuplicateId(null); setOpen(true); }}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-on-primary shadow-sm hover:bg-primary/90"
      >
        產生本期帳單
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl ring-1 ring-outline-variant">
            <h2 className="mb-2 text-xl font-medium text-on-surface">產生本期帳單</h2>
            <p className="text-sm text-on-surface-variant">
              系統將依合約租金條件，自動產生「本期」帳單（依收租日推算期間與應繳日）。<br />
              建立後可進入帳單頁填入水/電度數，金額會自動重算。
            </p>
            {error && (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-error">{error}</p>
                {duplicateId && (
                  <button
                    type="button"
                    onClick={() => router.push(`/finance/invoices/${duplicateId}`)}
                    className="text-sm text-primary hover:underline"
                  >
                    → 查看既有帳單
                  </button>
                )}
              </div>
            )}
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outlined" onClick={() => setOpen(false)} type="button">取消</Button>
              <Button variant="filled" onClick={handleGenerate} disabled={isPending}>
                {isPending ? "建立中…" : "確認產生"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
