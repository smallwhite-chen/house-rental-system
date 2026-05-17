"use client";
import { useRouter } from "next/navigation";
import { SelectChevron } from "@/components/ui/Select";

type Props = {
  properties: { id: string; name: string }[];
  currentValue: string; // "ALL" 或 propertyId
};

/**
 * Dashboard 頂部房產篩選下拉。
 * 切換時更新 URL searchParam（?propertyId=xxx），server 自動重新撈資料。
 */
export function PropertyFilter({ properties, currentValue }: Props) {
  const router = useRouter();

  function handleChange(value: string) {
    if (value === "ALL") {
      router.push("/dashboard");
    } else {
      router.push(`/dashboard?propertyId=${encodeURIComponent(value)}`);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="dashboard-property" className="text-sm text-on-surface-variant">
        房產篩選：
      </label>
      <div className="relative">
        <select
          id="dashboard-property"
          value={currentValue}
          onChange={(e) => handleChange(e.target.value)}
          className="block appearance-none rounded-full bg-surface pl-5 pr-10 py-2 text-sm text-on-surface ring-1 ring-inset ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="ALL">全部房產</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <SelectChevron />
      </div>
    </div>
  );
}
