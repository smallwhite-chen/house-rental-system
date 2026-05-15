"use client";
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

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export function PermissionMatrix({ initialPermissions = [], disabled = false }: Props) {
  const hasPermission = (module: ModuleKey, action: PermissionAction) =>
    initialPermissions.some((p) => p.module === module && p.action === action);

  const groups = groupBy(MODULES, (m) => m.group);

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-outline-variant">
      <table className="w-full text-sm">
        <thead className="bg-surface-container-high text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
          <tr>
            <th className="px-4 py-3 w-52">模組</th>
            {ACTIONS.map((a) => (
              <th key={a.key} className="px-4 py-3 text-center w-20">{a.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {Object.entries(groups).map(([group, modules]) => (
            <>
              <tr key={`group-${group}`} className="bg-surface-container">
                <td colSpan={5} className="px-4 py-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
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
                        defaultChecked={disabled || hasPermission(mod.key, action.key)}
                        disabled={disabled}
                        className="h-4 w-4 rounded border-outline accent-primary disabled:cursor-not-allowed disabled:opacity-60"
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
