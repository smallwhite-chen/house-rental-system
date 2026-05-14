import type { SelectHTMLAttributes } from "react";

/**
 * MD3 Outlined Select — 對應 design-system 中的下拉選單。
 *
 * Props 不接受 `children`；改透過 `options` prop 控制，避免每個呼叫端重複寫 <option>。
 * 每個 option 支援 { value, label } 對齊「儲存值」與「顯示文字」可不同的需求。
 */
type SelectOption = { value: string; label: string };

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  options: ReadonlyArray<SelectOption | string>;
  error?: boolean;
};

export function Select({
  options,
  error,
  className = "",
  ...rest
}: SelectProps) {
  return (
    <select
      className={`block w-full rounded-lg border-0 bg-surface px-4 py-3 text-on-surface ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-inset ${
        error ? "ring-error focus:ring-error" : "ring-outline focus:ring-primary"
      } ${className}`}
      {...rest}
    >
      {options.map((opt) => {
        const value = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
}
