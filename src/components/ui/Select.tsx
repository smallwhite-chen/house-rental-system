import type { SelectHTMLAttributes } from "react";

/**
 * MD3 Outlined Select — 對應 design-system 中的下拉選單。
 *
 * Props 不接受 `children`；改透過 `options` prop 控制，避免每個呼叫端重複寫 <option>。
 * 每個 option 支援 { value, label } 對齊「儲存值」與「顯示文字」可不同的需求。
 *
 * 樣式：appearance-none 隱藏瀏覽器預設箭頭，使用 SelectChevron 自繪 v 形圖示，
 * 並預留 pr-10 給圖示空間，避免文字被遮住。
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
    <div className="relative">
      <select
        className={`block w-full appearance-none rounded-lg border-0 bg-surface pl-4 pr-10 py-3 text-on-surface ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-inset ${
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
      <SelectChevron />
    </div>
  );
}

/**
 * 共用的下拉箭頭圖示。
 * 適用於使用 appearance-none 的原生 <select>；外層需 position: relative。
 */
export function SelectChevron({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant ${className}`}
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
