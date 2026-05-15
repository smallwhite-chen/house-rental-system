"use client";
import { useState, useRef, useEffect } from "react";
import type { ModuleKey, PermissionAction } from "@/generated/prisma/client";

type Permission = { module: ModuleKey; action: PermissionAction };

type Props = {
  initialPermissions?: Permission[];
  disabled?: boolean;
};

const MODULES: Array<{ key: ModuleKey; label: string; group: string }> = [
  { key: "SETTINGS_GENERAL", label: "系統基本設定", group: "系統設定" },
  { key: "SETTINGS_ACCOUNTS", label: "帳號管理", group: "系統設定" },
  { key: "SETTINGS_ROLES", label: "角色管理", group: "系統設定" },
  { key: "SETTINGS_NOTIFICATIONS", label: "通知與提醒設定", group: "系統設定" },
  { key: "SETTINGS_PAYMENT_METHODS", label: "收款方式管理", group: "系統設定" },
  { key: "SETTINGS_PROPERTY_TYPES", label: "房產種類管理", group: "系統設定" },
  { key: "SETTINGS_INCOME_TYPES", label: "收入種類管理", group: "系統設定" },
  { key: "SETTINGS_EXPENSE_TYPES", label: "支出種類管理", group: "系統設定" },
  { key: "SETTINGS_EQUIPMENT_TYPES", label: "設備種類管理", group: "系統設定" },
  { key: "SETTINGS_COMMUNICATION_TAGS", label: "溝通標籤管理", group: "系統設定" },
  { key: "SETTINGS_AUDIT_LOG", label: "稽核紀錄", group: "系統設定" },
  { key: "DASHBOARD", label: "儀表板", group: "主功能" },
  { key: "PROPERTIES", label: "房產管理", group: "主功能" },
  { key: "TENANTS", label: "房客管理", group: "主功能" },
  { key: "CONTRACTS", label: "合約管理", group: "主功能" },
  { key: "INVOICES", label: "帳單管理", group: "主功能" },
  { key: "PAYMENTS", label: "收款紀錄", group: "主功能" },
  { key: "REPORTS", label: "財務報表", group: "主功能" },
  { key: "EXPENSES", label: "支出管理", group: "主功能" },
  { key: "COMMUNICATIONS", label: "溝通與維修", group: "主功能" },
];

const ACTIONS: Array<{ key: PermissionAction; label: string }> = [
  { key: "VIEW", label: "檢視" },
  { key: "CREATE", label: "新增" },
  { key: "EDIT", label: "編輯" },
  { key: "DELETE", label: "刪除" },
];

function permKey(module: ModuleKey, action: PermissionAction) {
  return `${module}_${action}`;
}

function buildInitialSet(perms: Permission[], disabled: boolean): Set<string> {
  if (disabled) {
    const all = new Set<string>();
    MODULES.forEach((m) => ACTIONS.forEach((a) => all.add(permKey(m.key, a.key))));
    return all;
  }
  return new Set(perms.map((p) => permKey(p.module, p.action)));
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

// ── 全選 checkbox（支援 indeterminate 狀態）──────────────────────────────────
function SelectAllCheckbox({
  allChecked,
  someChecked,
  disabled,
  onToggle,
}: {
  allChecked: boolean;
  someChecked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = someChecked;
    }
  }, [someChecked]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={allChecked}
      disabled={disabled}
      onChange={onToggle}
      className="h-4 w-4 cursor-pointer rounded border-outline accent-primary disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}

// ── 主元件 ───────────────────────────────────────────────────────────────────
export function PermissionMatrix({ initialPermissions = [], disabled = false }: Props) {
  const [checked, setChecked] = useState<Set<string>>(() =>
    buildInitialSet(initialPermissions, disabled)
  );

  const isChecked = (mod: ModuleKey, action: PermissionAction) =>
    checked.has(permKey(mod, action));

  function toggle(mod: ModuleKey, action: PermissionAction) {
    if (disabled) return;
    const k = permKey(mod, action);
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  }

  // 整欄全選 / 取消
  function toggleColumn(action: PermissionAction) {
    if (disabled) return;
    const all = MODULES.every((m) => checked.has(permKey(m.key, action)));
    setChecked((prev) => {
      const next = new Set(prev);
      MODULES.forEach((m) =>
        all ? next.delete(permKey(m.key, action)) : next.add(permKey(m.key, action))
      );
      return next;
    });
  }

  function columnAllChecked(action: PermissionAction) {
    return MODULES.every((m) => checked.has(permKey(m.key, action)));
  }
  function columnSomeChecked(action: PermissionAction) {
    return (
      MODULES.some((m) => checked.has(permKey(m.key, action))) &&
      !columnAllChecked(action)
    );
  }

  const groups = groupBy(MODULES, (m) => m.group);

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-outline-variant">
      <table className="w-full text-sm">
        <thead>
          {/* 欄位標題列 */}
          <tr className="bg-surface-container-high text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
            <th className="w-52 px-4 py-3">模組</th>
            {ACTIONS.map((a) => (
              <th key={a.key} className="w-20 px-4 py-3 text-center">
                {a.label}
              </th>
            ))}
          </tr>
          {/* 整欄全選列 */}
          {!disabled && (
            <tr className="border-b border-outline-variant bg-primary-container/30">
              <td className="px-4 py-2 text-xs font-semibold text-primary">
                全選
              </td>
              {ACTIONS.map((a) => (
                <td key={a.key} className="px-4 py-2 text-center">
                  <SelectAllCheckbox
                    allChecked={columnAllChecked(a.key)}
                    someChecked={columnSomeChecked(a.key)}
                    disabled={disabled}
                    onToggle={() => toggleColumn(a.key)}
                  />
                </td>
              ))}
            </tr>
          )}
        </thead>

        <tbody className="divide-y divide-outline-variant">
          {Object.entries(groups).map(([group, modules]) => (
            <>
              <tr key={`group-${group}`} className="bg-surface-container">
                <td
                  colSpan={5}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  {group}
                </td>
              </tr>
              {modules.map((mod) => (
                <tr key={mod.key} className="hover:bg-surface-container/50">
                  <td className="px-4 py-3 text-on-surface">{mod.label}</td>
                  {ACTIONS.map((action) => (
                    <td key={action.key} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        name={`perm_${mod.key}_${action.key}`}
                        checked={isChecked(mod.key, action.key)}
                        disabled={disabled}
                        onChange={() => toggle(mod.key, action.key)}
                        className="h-4 w-4 cursor-pointer rounded border-outline accent-primary disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
