"use client";
import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { FormField } from "@/components/ui/FormField";
import { SelectChevron } from "@/components/ui/Select";
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";
import { uploadFileAction } from "@/app/actions/upload";
import { getCities, getDistricts } from "@/lib/taiwan-districts";
import type { PropertyKind } from "@/generated/prisma/client";

type PropertyType = { id: string; name: string };

export type PropertyFormData = {
  kind: PropertyKind; // 新增模式必傳；編輯模式由 server 帶入（不可變更）
  name: string;
  propertyTypeId: string;
  city: string;
  district: string;
  address: string;
  buildYear: number | null;
  totalFloors: number | null;
  baseRent: string | null; // 僅 WHOLE_BUILDING；以字串避免 Decimal 序列化
  images: string[];
  note: string | null;
};

type Props = {
  propertyTypes: PropertyType[];
  /** 建立模式：由 Modal 選好後傳入；編輯模式：從 DB 讀取，不可變更。 */
  kind: PropertyKind;
  /** 編輯模式時 true；表單會 disable 不可變更欄位（如 kind）。 */
  mode: "create" | "edit";
  initial?: PropertyFormData;
  submitLabel: string;
  onSubmit: (fd: FormData) => Promise<{ error?: string; id?: string }>;
};

export function PropertyForm({
  propertyTypes,
  kind,
  mode,
  initial,
  submitLabel,
  onSubmit,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [city, setCity] = useState(initial?.city ?? "");
  const [district, setDistrict] = useState(initial?.district ?? "");
  const [isPending, start] = useTransition();

  const cities = useMemo(() => getCities(), []);
  const districts = useMemo(() => getDistricts(city), [city]);

  function handleCityChange(newCity: string) {
    setCity(newCity);
    if (!getDistricts(newCity).includes(district)) {
      setDistrict("");
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await onSubmit(fd);
      if (res?.error) { setError(res.error); return; }
      if (res?.id) router.push(`/properties/${res.id}`);
      else router.push("/properties");
    });
  }

  const isWhole = kind === "WHOLE_BUILDING";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 隱形 kind：建立模式由 Modal 傳；編輯模式從 initial 帶（後端會以 DB 為準） */}
      <input type="hidden" name="kind" value={kind} />

      <div className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-on-surface">基本資料</h2>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              isWhole
                ? "bg-status-completed/12 text-status-completed"
                : "bg-primary-container text-on-primary-container"
            }`}
          >
            {isWhole ? "🏪 整棟型" : "🏢 多單位型"}
            {mode === "edit" && <span className="text-[10px] opacity-70">· 不可變更</span>}
          </span>
        </div>

        <FormField label="房產名稱" htmlFor="name" required>
          <TextInput id="name" name="name" defaultValue={initial?.name} placeholder={isWhole ? "例如：忠孝店面" : "例如：松江大樓"} required autoFocus />
        </FormField>

        <FormField label="房產種類" htmlFor="propertyTypeId" required>
          {propertyTypes.length === 0 ? (
            <div className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
              尚未建立任何房產種類，請先到「<a className="underline" href="/settings/property-types">系統設定 → 房產種類管理</a>」建立。
            </div>
          ) : (
            <div className="relative">
              <select
                id="propertyTypeId"
                name="propertyTypeId"
                defaultValue={initial?.propertyTypeId ?? ""}
                required
                className="block w-full appearance-none rounded-lg border-0 bg-surface pl-4 pr-10 py-3 text-on-surface ring-1 ring-inset ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="" disabled>請選擇</option>
                {propertyTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <SelectChevron />
            </div>
          )}
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="縣市" htmlFor="city" required>
            <div className="relative">
              <select
                id="city"
                name="city"
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                required
                className="block w-full appearance-none rounded-lg border-0 bg-surface pl-4 pr-10 py-3 text-on-surface ring-1 ring-inset ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="" disabled>請選擇縣市</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <SelectChevron />
            </div>
          </FormField>

          <FormField label="行政區" htmlFor="district" required>
            <div className="relative">
              <select
                id="district"
                name="district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
                disabled={!city}
                className="block w-full appearance-none rounded-lg border-0 bg-surface pl-4 pr-10 py-3 text-on-surface ring-1 ring-inset ring-outline focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="" disabled>{city ? "請選擇行政區" : "請先選縣市"}</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <SelectChevron />
            </div>
          </FormField>
        </div>

        <FormField label="地址" htmlFor="address" required>
          <TextInput id="address" name="address" defaultValue={initial?.address} placeholder="例如：忠孝東路四段 100 號" required />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="建築年份" htmlFor="buildYear">
            <TextInput id="buildYear" name="buildYear" type="number" inputMode="numeric" min={1900} max={2100} defaultValue={initial?.buildYear ?? ""} placeholder="選填" />
          </FormField>

          <FormField
            label="總樓層數"
            htmlFor="totalFloors"
            helper={isWhole ? "純記錄性（不影響合約）" : "影響房間樓層下拉選單"}
          >
            <TextInput id="totalFloors" name="totalFloors" type="number" inputMode="numeric" min={1} max={200} defaultValue={initial?.totalFloors ?? ""} placeholder="選填" />
          </FormField>
        </div>

        {/* WHOLE_BUILDING 才顯示 baseRent；MULTI_UNIT 在房間設定 */}
        {isWhole && (
          <FormField
            label="基本租金（每月）"
            htmlFor="baseRent"
            required
            helper="可在合約中調整實際租金"
          >
            <TextInput
              id="baseRent"
              name="baseRent"
              type="number"
              inputMode="numeric"
              min={0}
              step="1"
              defaultValue={initial?.baseRent ?? ""}
              placeholder="例如：30000"
              required
            />
          </FormField>
        )}

        <FormField label="房產圖片" htmlFor="images" helper="可上傳多張">
          <MultiImageUpload
            name="images"
            prefix="properties"
            defaultUrls={initial?.images ?? []}
            uploadAction={uploadFileAction}
          />
        </FormField>

        <FormField label="備註" htmlFor="note">
          <TextInput id="note" name="note" defaultValue={initial?.note ?? ""} placeholder="選填" />
        </FormField>
      </div>

      {error && (
        <div className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">{error}</div>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outlined" type="button" onClick={() => router.back()}>取消</Button>
        <Button variant="filled" type="submit" disabled={isPending || propertyTypes.length === 0}>
          {isPending ? "儲存中…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
