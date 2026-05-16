"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { FormField } from "@/components/ui/FormField";
import type { UnitType } from "@/generated/prisma/client";

export type UnitFormInitial = {
  number: string;
  floor: number;
  type: UnitType;
  area: number | null;
  baseRent: number;
  note: string | null;
  manualMaintenance: boolean; // 是否處於管理者手動「整修中」狀態
};

type Props = {
  propertyId: string;
  totalFloors: number | null;
  initial?: UnitFormInitial;
  submitLabel: string;
  onSubmit: (fd: FormData) => Promise<{ error?: string; id?: string }>;
  /** 是否允許設定手動「整修中」狀態。新增時為 false（新房間還沒任何合約） */
  allowManualStatus: boolean;
};

export function UnitForm({ propertyId, totalFloors, initial, submitLabel, onSubmit, allowManualStatus }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();

  // 樓層下拉選項：依房產 totalFloors 產生 1 ~ N；若 totalFloors 未設定，用 1-20
  const floorOptions = Array.from(
    { length: totalFloors && totalFloors > 0 ? totalFloors : 20 },
    (_, i) => i + 1
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await onSubmit(fd);
      if (res?.error) { setError(res.error); return; }
      router.push(`/properties/${propertyId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant space-y-4">
        <h2 className="text-lg font-medium text-on-surface">房間資料</h2>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="房間編號" htmlFor="number" required helper="同一房產內不可重複">
            <TextInput id="number" name="number" defaultValue={initial?.number} placeholder="例如：301" required autoFocus />
          </FormField>

          <FormField label="樓層" htmlFor="floor" required>
            <select
              id="floor"
              name="floor"
              defaultValue={initial?.floor ?? ""}
              required
              className="block w-full rounded-lg border-0 bg-surface px-4 py-3 text-on-surface ring-1 ring-inset ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="" disabled>請選擇樓層</option>
              {floorOptions.map((f) => (
                <option key={f} value={f}>{f} 樓</option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="房間類型" htmlFor="type" required>
            <select
              id="type"
              name="type"
              defaultValue={initial?.type ?? "SUITE"}
              required
              className="block w-full rounded-lg border-0 bg-surface px-4 py-3 text-on-surface ring-1 ring-inset ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="SUITE">套房</option>
              <option value="ROOM">雅房</option>
            </select>
          </FormField>

          <FormField label="坪數" htmlFor="area">
            <TextInput id="area" name="area" type="number" inputMode="decimal" step="0.1" min={0} defaultValue={initial?.area ?? ""} placeholder="選填" />
          </FormField>
        </div>

        <FormField label="基本租金 (NT$/月)" htmlFor="baseRent" required helper="合約簽訂時可調整實際租金">
          <TextInput id="baseRent" name="baseRent" type="number" inputMode="numeric" min={0} step={100} defaultValue={initial?.baseRent ?? ""} placeholder="例如：15000" required />
        </FormField>

        <FormField label="備註" htmlFor="note">
          <TextInput id="note" name="note" defaultValue={initial?.note ?? ""} placeholder="最多 500 字" />
        </FormField>
      </div>

      {allowManualStatus && (
        <div className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
          <h2 className="text-lg font-medium text-on-surface">手動狀態覆寫</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            出租中、合約逾期、空置由系統依合約自動判斷；勾選下方可將狀態手動鎖定為「整修中」。
          </p>
          <label className="mt-4 flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="manualStatus"
              value="MAINTENANCE"
              defaultChecked={initial?.manualMaintenance}
              className="h-4 w-4 rounded border-outline accent-primary"
            />
            <span className="text-sm text-on-surface">
              設定為「整修中」（暫停接受新合約）
            </span>
          </label>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">{error}</div>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outlined" type="button" onClick={() => router.back()}>取消</Button>
        <Button variant="filled" type="submit" disabled={isPending}>
          {isPending ? "儲存中…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
