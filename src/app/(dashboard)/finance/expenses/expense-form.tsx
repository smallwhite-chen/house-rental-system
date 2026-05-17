"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { FileUpload } from "@/components/ui/FileUpload";
import { uploadFileAction } from "@/app/actions/upload";
import type { ExpenseLevel } from "@/generated/prisma/client";

export type ExpenseTypeOpt = { id: string; name: string };
export type PropertyOpt = { id: string; name: string };
export type UnitOpt = { id: string; number: string; propertyId: string };

export type ExpenseFormInitial = {
  expenseTypeId?: string;
  expenseDate?: string;
  amount?: string;
  propertyId?: string;
  level?: ExpenseLevel;
  unitId?: string | null;
  receiptUrl?: string | null;
  note?: string | null;
};

type Props = {
  expenseTypes: ExpenseTypeOpt[];
  properties: PropertyOpt[];
  units: UnitOpt[];
  initial?: ExpenseFormInitial;
  submitLabel: string;
  onSubmit: (fd: FormData) => Promise<{ error?: string; ok?: true; id?: string }>;
  nextPath?: string;
};

export function ExpenseForm({
  expenseTypes,
  properties,
  units,
  initial = {},
  submitLabel,
  onSubmit,
  nextPath,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();

  const today = new Date().toISOString().slice(0, 10);

  // 受控狀態：房產→房間連動 + 層級切換
  const [propertyId, setPropertyId] = useState(initial.propertyId ?? "");
  const [level, setLevel] = useState<ExpenseLevel>(initial.level ?? "PROPERTY");
  const [unitId, setUnitId] = useState(initial.unitId ?? "");

  const filteredUnits = propertyId ? units.filter((u) => u.propertyId === propertyId) : [];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await onSubmit(fd);
      if (res?.error) { setError(res.error); return; }
      router.push(nextPath ?? "/finance/expenses");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="text-lg font-medium text-on-surface">支出資料</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="支出種類" htmlFor="expenseTypeId" required>
            <Select
              id="expenseTypeId"
              name="expenseTypeId"
              defaultValue={initial.expenseTypeId ?? ""}
              required
              options={[
                { value: "", label: "— 請選擇 —" },
                ...expenseTypes.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
          </FormField>

          <FormField label="支出日期" htmlFor="expenseDate" required>
            <TextInput
              id="expenseDate"
              name="expenseDate"
              type="date"
              defaultValue={initial.expenseDate ?? today}
              required
            />
          </FormField>

          <FormField label="支出金額" htmlFor="amount" required>
            <TextInput
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={initial.amount ?? ""}
              required
            />
          </FormField>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="text-lg font-medium text-on-surface">關聯資料</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="關聯房產" htmlFor="propertyId" required>
            <Select
              id="propertyId"
              name="propertyId"
              value={propertyId}
              onChange={(e) => {
                setPropertyId(e.target.value);
                setUnitId(""); // 切房產時清空房間
              }}
              required
              options={[
                { value: "", label: "— 請選擇 —" },
                ...properties.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </FormField>

          <FormField label="支出層級" required>
            <div className="flex gap-3">
              {[
                { value: "PROPERTY" as const, label: "🏢 房產層級", desc: "整棟共用" },
                { value: "UNIT" as const, label: "🚪 房間層級", desc: "特定房間" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex flex-1 cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition-colors ${
                    level === opt.value
                      ? "border-primary bg-primary-container/50 text-on-primary-container"
                      : "border-outline-variant bg-surface hover:bg-surface-container"
                  }`}
                >
                  <input
                    type="radio"
                    name="level"
                    value={opt.value}
                    checked={level === opt.value}
                    onChange={() => setLevel(opt.value)}
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <div>
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-xs text-on-surface-variant">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </FormField>
        </div>

        {level === "UNIT" && (
          <FormField
            label="關聯房間"
            htmlFor="unitId"
            required
            helper={!propertyId ? "請先選擇關聯房產" : undefined}
          >
            <Select
              id="unitId"
              name="unitId"
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              disabled={!propertyId}
              required
              options={[
                { value: "", label: propertyId ? "— 請選擇 —" : "— 請先選房產 —" },
                ...filteredUnits.map((u) => ({ value: u.id, label: u.number })),
              ]}
            />
          </FormField>
        )}
      </section>

      <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="text-lg font-medium text-on-surface">其他</h2>

        <FormField label="收據 / 發票" htmlFor="receiptUrl">
          <FileUpload
            name="receiptUrl"
            prefix="expenses"
            kind="image"
            defaultUrl={initial.receiptUrl}
            label="點擊或拖入收據／發票圖片"
            uploadAction={uploadFileAction}
          />
        </FormField>

        <FormField label="備註" htmlFor="note">
          <textarea
            id="note"
            name="note"
            rows={3}
            defaultValue={initial.note ?? ""}
            placeholder="選填"
            className="block w-full rounded-lg border-0 bg-surface px-4 py-3 text-on-surface ring-1 ring-inset ring-outline placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          />
        </FormField>
      </section>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button variant="outlined" type="button" onClick={() => router.back()}>取消</Button>
        <Button variant="filled" type="submit" disabled={isPending}>
          {isPending ? "儲存中…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
