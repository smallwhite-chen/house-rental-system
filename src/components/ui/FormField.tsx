import type { ReactNode } from "react";

/**
 * 表單欄位包裝：Label + 內容（Input 等）+ 錯誤訊息／提示文字。
 *
 * 用法：
 *   <FormField label="Email" htmlFor="email" error="Email 格式不正確">
 *     <TextInput id="email" name="email" type="email" />
 *   </FormField>
 */
export function FormField({
  label,
  htmlFor,
  error,
  helper,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  helper?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-on-surface"
      >
        {label}
        {required && <span className="ml-1 text-error">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-error">{error}</p>
      ) : helper ? (
        <p className="text-sm text-on-surface-variant">{helper}</p>
      ) : null}
    </div>
  );
}
