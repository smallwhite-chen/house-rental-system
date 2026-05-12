import type { InputHTMLAttributes } from "react";

/**
 * MD3 Outlined Text Input。
 *
 * 規格：圓角 lg、ring-1 ring-outline、focus 時 ring-2 ring-primary。
 * error 狀態：ring 改為 error 色。
 */
type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export function TextInput({
  error,
  className = "",
  type = "text",
  ...rest
}: TextInputProps) {
  return (
    <input
      type={type}
      className={`block w-full rounded-lg border-0 bg-surface px-4 py-3 text-on-surface ring-1 ring-inset placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-inset ${
        error ? "ring-error focus:ring-error" : "ring-outline focus:ring-primary"
      } ${className}`}
      {...rest}
    />
  );
}
