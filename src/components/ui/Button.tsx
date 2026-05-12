import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * MD3 按鈕元件 — 5 種變體。
 *
 * 規格：h-10 (40px) 高、圓角 full（膠囊形）、focus 時 ring-2 ring-primary。
 *
 * 變體：
 * - filled    主要操作（綠底白字）
 * - tonal     次要操作（淺綠灰底深綠字）
 * - outlined  替代操作（透明底 + 描邊 + 主色字）
 * - text      第三選項（純文字按鈕，padding 較窄）
 * - danger    破壞性操作（紅底白字）
 */
export type ButtonVariant = "filled" | "tonal" | "outlined" | "text" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** 圖示放在文字前（左側）。 */
  leadingIcon?: ReactNode;
  /** 滿寬，常用於表單主要送出按鈕。 */
  fullWidth?: boolean;
};

const BASE =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  filled:
    "bg-primary text-on-primary hover:bg-primary/90 active:bg-primary/80 shadow-sm px-6",
  tonal:
    "bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 px-6",
  outlined:
    "bg-transparent text-primary ring-1 ring-outline hover:bg-primary/8 px-6",
  text: "bg-transparent text-primary hover:bg-primary/8 px-4",
  danger:
    "bg-error text-on-error hover:bg-error/90 shadow-sm px-6",
};

export function Button({
  variant = "filled",
  leadingIcon,
  fullWidth,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BASE} ${VARIANT_CLASSES[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {leadingIcon}
      {children}
    </button>
  );
}
