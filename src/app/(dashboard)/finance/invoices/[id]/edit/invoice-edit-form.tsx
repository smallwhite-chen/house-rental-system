"use client";
import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { FormField } from "@/components/ui/FormField";

type Props = {
  invoiceId: string;
  initial: {
    waterMeterReading: string;
    waterUnitPrice: number; // 計算用：優先取合約現值
    electricityMeterReading: string;
    electricityUnitPrice: number;
    // 比較顯示用
    invoiceWaterUnitPrice: number | null;
    contractWaterUnitPrice: number | null;
    invoiceElectricityUnitPrice: number | null;
    contractElectricityUnitPrice: number | null;
    rentAmount: number;
    managementFee: number; // 計算用：優先取合約現值
    invoiceManagementFee: number | null;
    contractManagementFee: number | null;
    note: string;
  };
  onSubmit: (fd: FormData) => Promise<{ error?: string; ok?: true }>;
};

export function InvoiceEditForm({ invoiceId, initial, onSubmit }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();

  const [waterReading, setWaterReading] = useState(initial.waterMeterReading);
  const [elecReading, setElecReading] = useState(initial.electricityMeterReading);
  const [noteLen, setNoteLen] = useState(initial.note.length);

  // 即時試算
  const preview = useMemo(() => {
    const water = waterReading === "" ? 0 : Number(waterReading) * initial.waterUnitPrice;
    const elec = elecReading === "" ? 0 : Number(elecReading) * initial.electricityUnitPrice;
    const total = initial.rentAmount + initial.managementFee + water + elec;
    return { water: round2(water), elec: round2(elec), total: round2(total) };
  }, [waterReading, elecReading, initial]);

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
        <h2 className="text-lg font-medium text-on-surface">度數填寫</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FormField label="水費度數" htmlFor="waterMeterReading">
              <TextInput
                id="waterMeterReading"
                name="waterMeterReading"
                type="number"
                min="0"
                step="0.01"
                value={waterReading}
                onChange={(e) => setWaterReading(e.target.value)}
                placeholder="（選填）"
              />
            </FormField>
            <UnitPriceHint
              label="水費"
              invoicePrice={initial.invoiceWaterUnitPrice}
              contractPrice={initial.contractWaterUnitPrice}
              previewAmount={preview.water}
            />
          </div>

          <div>
            <FormField label="電費度數" htmlFor="electricityMeterReading">
              <TextInput
                id="electricityMeterReading"
                name="electricityMeterReading"
                type="number"
                min="0"
                step="0.01"
                value={elecReading}
                onChange={(e) => setElecReading(e.target.value)}
                placeholder="（選填）"
              />
            </FormField>
            <UnitPriceHint
              label="電費"
              invoicePrice={initial.invoiceElectricityUnitPrice}
              contractPrice={initial.contractElectricityUnitPrice}
              previewAmount={preview.elec}
            />
          </div>
        </div>

        <div className="rounded-xl bg-surface-container p-4 text-sm">
          <div className="flex justify-between"><span className="text-on-surface-variant">租金</span><span>NT$ {money(initial.rentAmount)}</span></div>
          <div className="flex justify-between"><span className="text-on-surface-variant">管理費</span><span>NT$ {money(initial.managementFee)}</span></div>
          {/* 管理費 snapshot 提示：合約現值與帳單 snapshot 不同 */}
          {initial.contractManagementFee != null &&
            initial.invoiceManagementFee !== initial.contractManagementFee && (
              <p className="-mt-1 mb-1 text-xs text-status-maintenance">
                ⓘ 帳單管理費 snapshot 為 {initial.invoiceManagementFee == null ? "未設" : `NT$ ${money(initial.invoiceManagementFee)}`}；
                儲存後將自動同步為合約現值 NT$ {money(initial.contractManagementFee)}
              </p>
            )}
          <div className="flex justify-between"><span className="text-on-surface-variant">水費</span><span>NT$ {money(preview.water)}</span></div>
          <div className="flex justify-between"><span className="text-on-surface-variant">電費</span><span>NT$ {money(preview.elec)}</span></div>
          <div className="mt-2 border-t border-outline-variant pt-2 flex justify-between font-medium">
            <span>新應收總額</span>
            <span className="text-lg text-primary">NT$ {money(preview.total)}</span>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="text-lg font-medium text-on-surface">備註</h2>
        <FormField label="備註" htmlFor="note" helper={`${noteLen} / 500`}>
          <textarea
            id="note"
            name="note"
            rows={3}
            maxLength={500}
            defaultValue={initial.note}
            onChange={(e) => setNoteLen(e.target.value.length)}
            placeholder="選填，最多 500 字"
            className="block w-full rounded-lg border-0 bg-surface px-4 py-3 text-on-surface ring-1 ring-inset ring-outline placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          />
        </FormField>
      </section>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button variant="outlined" type="button" onClick={() => router.back()}>取消</Button>
        <Button variant="filled" type="submit" disabled={isPending}>
          {isPending ? "儲存中…" : "儲存變更"}
        </Button>
      </div>
    </form>
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function money(n: number): string {
  return n.toLocaleString("zh-TW", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/**
 * 顯示「合約單價」與「帳單 snapshot」的對照資訊。
 * - 合約未設單價：⚠ 警告
 * - 帳單 snapshot 與合約現值不同：說明儲存時會自動同步
 * - 兩者一致：單純顯示單價 + 試算金額
 */
function UnitPriceHint({
  label,
  invoicePrice,
  contractPrice,
  previewAmount,
}: {
  label: string;
  invoicePrice: number | null;
  contractPrice: number | null;
  previewAmount: number;
}) {
  if (contractPrice == null || contractPrice <= 0) {
    return (
      <p className="mt-1.5 text-sm text-error">
        ⚠ 合約未設{label}單價，填入度數後金額仍會以 0 計算。可至合約頁設定後再回此頁。
      </p>
    );
  }

  const snapshotDiffers = invoicePrice == null || invoicePrice !== contractPrice;

  return (
    <div className="mt-1.5 space-y-0.5 text-sm">
      <p className="text-on-surface-variant">
        合約{label}單價：<span className="font-medium text-on-surface">NT$ {contractPrice} / 度</span>
        <span className="ml-2 text-on-surface-variant">· 試算：NT$ {money(previewAmount)}</span>
      </p>
      {snapshotDiffers && (
        <p className="text-xs text-status-maintenance">
          ⓘ 帳單目前 snapshot 為 {invoicePrice == null ? "未設" : `NT$ ${invoicePrice}`}；儲存後將自動同步為合約現值。
        </p>
      )}
    </div>
  );
}
