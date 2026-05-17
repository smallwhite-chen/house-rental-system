"use client";
import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { COMMUNICATION_STATUS_OPTIONS } from "@/lib/communication-status";
import type { CommunicationStatus } from "@/generated/prisma/client";

export type PropertyOpt = { id: string; name: string };
export type UnitOpt = {
  id: string;
  number: string;
  propertyId: string;
  /** 該房間目前生效合約對應的房客（提示用，非自動帶入） */
  currentTenantId?: string | null;
  currentTenantName?: string | null;
};
export type TenantOpt = { id: string; name: string; phone: string };
export type TagOpt = { id: string; name: string };

export type CommunicationFormInitial = {
  unitId?: string;
  tenantId?: string;
  communicationDate?: string;
  content?: string;
  attachmentUrl?: string | null;
  status?: CommunicationStatus;
  note?: string | null;
  tagIds?: string[];
};

type Props = {
  properties: PropertyOpt[];
  units: UnitOpt[];
  tenants: TenantOpt[];
  tags: TagOpt[];
  initial?: CommunicationFormInitial;
  submitLabel: string;
  onSubmit: (fd: FormData) => Promise<{ error?: string; ok?: true; id?: string }>;
  nextPath?: string;
};

export function CommunicationForm({
  properties,
  units,
  tenants,
  tags,
  initial = {},
  submitLabel,
  onSubmit,
  nextPath,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();

  // 預設帶當下日期＋時間（瀏覽器當地時區），格式：YYYY-MM-DDTHH:mm
  const defaultDateTime = (() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  // 從 initial.unitId 反推 propertyId（編輯模式用）
  const initialPropertyId = useMemo(() => {
    if (!initial.unitId) return "";
    return units.find((u) => u.id === initial.unitId)?.propertyId ?? "";
  }, [initial.unitId, units]);

  const [propertyId, setPropertyId] = useState(initialPropertyId);
  const [unitId, setUnitId] = useState(initial.unitId ?? "");
  const [tenantId, setTenantId] = useState(initial.tenantId ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(initial.tagIds ?? []);

  const filteredUnits = propertyId ? units.filter((u) => u.propertyId === propertyId) : [];
  const selectedUnit = units.find((u) => u.id === unitId);

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    // 加入多選 tags（FormData 不會自動序列化 state）
    selectedTags.forEach((id) => fd.append("tagIds", id));
    start(async () => {
      const res = await onSubmit(fd);
      if (res?.error) { setError(res.error); return; }
      router.push(nextPath ?? "/communications");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="text-lg font-medium text-on-surface">關聯資料</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="關聯房產" htmlFor="propertyId" required>
            <Select
              id="propertyId"
              value={propertyId}
              onChange={(e) => {
                setPropertyId(e.target.value);
                setUnitId("");
              }}
              required={!propertyId}
              options={[
                { value: "", label: "— 請選擇 —" },
                ...properties.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </FormField>

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

          <FormField
            label="關聯房客"
            htmlFor="tenantId"
            required
            helper={
              selectedUnit?.currentTenantName
                ? `提示：此房間目前合約房客為「${selectedUnit.currentTenantName}」`
                : undefined
            }
          >
            <Select
              id="tenantId"
              name="tenantId"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              required
              options={[
                { value: "", label: "— 請選擇 —" },
                ...tenants.map((t) => ({ value: t.id, label: `${t.name}（${t.phone}）` })),
              ]}
            />
          </FormField>

          <FormField label="溝通日期 / 時間" htmlFor="communicationDate" required>
            <TextInput
              id="communicationDate"
              name="communicationDate"
              type="datetime-local"
              defaultValue={initial.communicationDate ?? defaultDateTime}
              required
            />
          </FormField>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="text-lg font-medium text-on-surface">內容</h2>

        <FormField label="標籤" htmlFor="tags" required helper="可多選；引用「系統設定 → 溝通標籤管理」">
          {tags.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              尚未建立任何標籤。請先到「<a href="/settings/communication-tags" className="text-primary hover:underline">系統設定 → 溝通標籤管理</a>」新增。
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const selected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      selected
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-high text-on-surface-variant ring-1 ring-outline hover:bg-surface-container"
                    }`}
                  >
                    {selected && <span className="mr-1">✓</span>}
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}
        </FormField>

        <FormField label="溝通內容" htmlFor="content" required>
          <textarea
            id="content"
            name="content"
            rows={4}
            defaultValue={initial.content ?? ""}
            required
            placeholder="例如：房客回報冷氣異音，已聯絡師傅預計週五到場…"
            className="block w-full rounded-lg border-0 bg-surface px-4 py-3 text-on-surface ring-1 ring-inset ring-outline placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          />
        </FormField>

        <FormField label="處理狀態" htmlFor="status" required>
          <div className="grid gap-3 md:grid-cols-3">
            {COMMUNICATION_STATUS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-surface p-3 text-sm transition-colors hover:bg-surface-container has-[:checked]:border-primary has-[:checked]:bg-primary-container/50 has-[:checked]:text-on-primary-container"
              >
                <input
                  type="radio"
                  name="status"
                  value={opt.value}
                  defaultChecked={(initial.status ?? "PENDING") === opt.value}
                  required
                  className="h-4 w-4 accent-primary"
                />
                <span className="font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
        </FormField>
      </section>

      <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="text-lg font-medium text-on-surface">其他</h2>

        <FormField label="附件 URL" htmlFor="attachmentUrl" helper="Phase 6 storage 上線後將改為檔案上傳">
          <TextInput
            id="attachmentUrl"
            name="attachmentUrl"
            type="url"
            defaultValue={initial.attachmentUrl ?? ""}
            placeholder="https://..."
          />
        </FormField>

        <FormField label="備註" htmlFor="note">
          <textarea
            id="note"
            name="note"
            rows={2}
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
