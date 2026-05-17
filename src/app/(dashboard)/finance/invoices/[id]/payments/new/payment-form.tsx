"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";

type Props = {
  invoiceId: string;
  defaultAmount: number;
  paymentMethods: { id: string; name: string }[];
  onSubmit: (fd: FormData) => Promise<{ error?: string; ok?: true }>;
};

export function PaymentForm({ invoiceId, defaultAmount, paymentMethods, onSubmit }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();

  // 預設今日
  const today = new Date().toISOString().slice(0, 10);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await onSubmit(fd);
      if (res?.error) { setError(res.error); return; }
      router.push(`/finance/invoices/${invoiceId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="text-lg font-medium text-on-surface">收款資料</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="收款日期" htmlFor="paymentDate" required>
            <TextInput id="paymentDate" name="paymentDate" type="date" defaultValue={today} required />
          </FormField>

          <FormField label="收款金額" htmlFor="amount" required helper="預設帶入「應收 − 累計已收」">
            <TextInput
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={defaultAmount}
              required
            />
          </FormField>

          <FormField label="收款方式" htmlFor="paymentMethodId" required>
            <Select
              id="paymentMethodId"
              name="paymentMethodId"
              required
              options={[
                { value: "", label: "— 請選擇 —" },
                ...paymentMethods.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </FormField>
        </div>

        <FormField label="備註" htmlFor="note">
          <textarea
            id="note"
            name="note"
            rows={3}
            placeholder="選填"
            className="block w-full rounded-lg border-0 bg-surface px-4 py-3 text-on-surface ring-1 ring-inset ring-outline placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          />
        </FormField>
      </section>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button variant="outlined" type="button" onClick={() => router.back()}>取消</Button>
        <Button variant="filled" type="submit" disabled={isPending}>
          {isPending ? "儲存中…" : "新增收款"}
        </Button>
      </div>
    </form>
  );
}
