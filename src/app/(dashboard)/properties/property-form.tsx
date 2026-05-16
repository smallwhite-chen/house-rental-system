"use client";
import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { FormField } from "@/components/ui/FormField";
import { getCities, getDistricts } from "@/lib/taiwan-districts";

type PropertyType = { id: string; name: string };

export type PropertyFormData = {
  name: string;
  propertyTypeId: string;
  city: string;
  district: string;
  address: string;
  buildYear: number | null;
  totalFloors: number | null;
  note: string | null;
};

type Props = {
  propertyTypes: PropertyType[];
  initial?: PropertyFormData;
  submitLabel: string;
  onSubmit: (fd: FormData) => Promise<{ error?: string; id?: string }>;
};

export function PropertyForm({ propertyTypes, initial, submitLabel, onSubmit }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [city, setCity] = useState(initial?.city ?? "");
  const [district, setDistrict] = useState(initial?.district ?? "");
  const [isPending, start] = useTransition();

  const cities = useMemo(() => getCities(), []);
  const districts = useMemo(() => getDistricts(city), [city]);

  function handleCityChange(newCity: string) {
    setCity(newCity);
    // 換縣市 → 清空已選的行政區
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant space-y-4">
        <h2 className="text-lg font-medium text-on-surface">基本資料</h2>

        <FormField label="房產名稱" htmlFor="name" required>
          <TextInput id="name" name="name" defaultValue={initial?.name} placeholder="例如：忠孝大廈" required autoFocus />
        </FormField>

        <FormField label="房產種類" htmlFor="propertyTypeId" required>
          {propertyTypes.length === 0 ? (
            <div className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
              尚未建立任何房產種類，請先到「<a className="underline" href="/settings/property-types">系統設定 → 房產種類管理</a>」建立。
            </div>
          ) : (
            <select
              id="propertyTypeId"
              name="propertyTypeId"
              defaultValue={initial?.propertyTypeId ?? ""}
              required
              className="block w-full rounded-lg border-0 bg-surface px-4 py-3 text-on-surface ring-1 ring-inset ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="" disabled>請選擇</option>
              {propertyTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="縣市" htmlFor="city" required>
            <select
              id="city"
              name="city"
              value={city}
              onChange={(e) => handleCityChange(e.target.value)}
              required
              className="block w-full rounded-lg border-0 bg-surface px-4 py-3 text-on-surface ring-1 ring-inset ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="" disabled>請選擇縣市</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FormField>

          <FormField label="行政區" htmlFor="district" required>
            <select
              id="district"
              name="district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              required
              disabled={!city}
              className="block w-full rounded-lg border-0 bg-surface px-4 py-3 text-on-surface ring-1 ring-inset ring-outline focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="" disabled>{city ? "請選擇行政區" : "請先選縣市"}</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="地址" htmlFor="address" required>
          <TextInput id="address" name="address" defaultValue={initial?.address} placeholder="例如：忠孝東路四段 100 號" required />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="建築年份" htmlFor="buildYear">
            <TextInput id="buildYear" name="buildYear" type="number" inputMode="numeric" min={1900} max={2100} defaultValue={initial?.buildYear ?? ""} placeholder="選填" />
          </FormField>

          <FormField label="總樓層數" htmlFor="totalFloors" helper="影響房間樓層下拉選單">
            <TextInput id="totalFloors" name="totalFloors" type="number" inputMode="numeric" min={1} max={200} defaultValue={initial?.totalFloors ?? ""} placeholder="選填" />
          </FormField>
        </div>

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
