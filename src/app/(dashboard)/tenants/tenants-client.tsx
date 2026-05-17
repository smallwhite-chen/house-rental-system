"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { TENANT_STATUS_META, type TenantStatus } from "@/lib/tenant-status";

type TenantRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  idNumberMasked: string;
  photoUrl: string | null;
  status: TenantStatus;
  currentUnitLabel: string | null;
  contractCount: number;
};

type Filter = "ALL" | TenantStatus;

const FILTER_TABS: Array<{ key: Filter; label: string }> = [
  { key: "ALL", label: "全部" },
  { key: "RENTED", label: "出租中" },
  { key: "OVERDUE", label: "合約逾期" },
  { key: "FORMER", label: "已退租" },
];

export function TenantsClient({
  tenants,
  canCreate,
}: {
  tenants: TenantRow[];
  canCreate: boolean;
}) {
  const [view, setView] = useState<"card" | "list">("card");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return tenants.filter((t) => {
      if (filter !== "ALL" && t.status !== filter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.phone.toLowerCase().includes(q) ||
          (t.email?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [tenants, filter, query]);

  const counts = useMemo(() => {
    return {
      ALL: tenants.length,
      RENTED: tenants.filter((t) => t.status === "RENTED").length,
      OVERDUE: tenants.filter((t) => t.status === "OVERDUE").length,
      FORMER: tenants.filter((t) => t.status === "FORMER").length,
    };
  }, [tenants]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-medium text-on-surface">房客管理</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            共 {tenants.length} 位房客（顯示 {filtered.length}）
          </p>
        </div>
        {canCreate && (
          <Link href="/tenants/new">
            <Button variant="filled" leadingIcon={<PlusIcon />}>新增房客</Button>
          </Link>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋房客姓名、電話或 Email…"
            className="block w-full rounded-full border-0 bg-surface px-5 py-2.5 text-sm text-on-surface ring-1 ring-inset ring-outline placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 rounded-full bg-surface-container-high p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === tab.key
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-70">{counts[tab.key]}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-full bg-surface-container-high p-1">
          <button
            onClick={() => setView("card")}
            className={`rounded-full p-1.5 ${view === "card" ? "bg-primary text-on-primary" : "text-on-surface-variant"}`}
            aria-label="卡片檢視"
          >
            <CardIcon />
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded-full p-1.5 ${view === "list" ? "bg-primary text-on-primary" : "text-on-surface-variant"}`}
            aria-label="列表檢視"
          >
            <ListIcon />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-surface py-16 text-center text-sm text-on-surface-variant ring-1 ring-outline-variant">
          {tenants.length === 0
            ? "尚無房客，請點擊右上角「新增房客」建立第一位。"
            : "此篩選條件下無房客。"}
        </div>
      ) : view === "card" ? (
        <CardView tenants={filtered} />
      ) : (
        <ListView tenants={filtered} />
      )}
    </div>
  );
}

function CardView({ tenants }: { tenants: TenantRow[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tenants.map((t) => {
        const meta = TENANT_STATUS_META[t.status];
        return (
          <Link
            key={t.id}
            href={`/tenants/${t.id}`}
            className="block rounded-2xl bg-surface p-5 ring-1 ring-outline-variant transition-all hover:shadow-md hover:ring-primary/40"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <TenantAvatar name={t.name} photoUrl={t.photoUrl} size={48} />
                <div>
                  <p className="font-medium text-on-surface">{t.name}</p>
                  <p className="text-xs text-on-surface-variant font-mono">{t.idNumberMasked}</p>
                </div>
              </div>
              <StatusChip tone={meta.tone} label={meta.label} />
            </div>
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="w-16 text-on-surface-variant">電話</dt>
                <dd className="text-on-surface">{t.phone}</dd>
              </div>
              {t.email && (
                <div className="flex gap-2">
                  <dt className="w-16 text-on-surface-variant">Email</dt>
                  <dd className="text-on-surface truncate">{t.email}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="w-16 text-on-surface-variant">現居</dt>
                <dd className="text-on-surface">
                  {t.currentUnitLabel ?? <span className="text-outline">—</span>}
                </dd>
              </div>
            </dl>
          </Link>
        );
      })}
    </div>
  );
}

function ListView({ tenants }: { tenants: TenantRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-outline-variant">
      <table className="w-full">
        <thead className="bg-surface-container-high text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
          <tr>
            <th className="px-6 py-3">姓名</th>
            <th className="px-6 py-3">電話</th>
            <th className="px-6 py-3">Email</th>
            <th className="px-6 py-3">現居房間</th>
            <th className="px-6 py-3">租住狀態</th>
            <th className="px-6 py-3 text-right whitespace-nowrap"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
          {tenants.map((t) => {
            const meta = TENANT_STATUS_META[t.status];
            return (
              <tr key={t.id} className="transition-colors hover:bg-surface-container">
                <td className="px-6 py-4">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-on-surface-variant font-mono">{t.idNumberMasked}</div>
                </td>
                <td className="px-6 py-4 text-on-surface-variant">{t.phone}</td>
                <td className="px-6 py-4 text-on-surface-variant">
                  {t.email ?? <span className="text-outline">—</span>}
                </td>
                <td className="px-6 py-4 text-on-surface-variant">
                  {t.currentUnitLabel ?? <span className="text-outline">—</span>}
                </td>
                <td className="px-6 py-4">
                  <StatusChip tone={meta.tone} label={meta.label} />
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <Link
                    href={`/tenants/${t.id}`}
                    className="rounded-full px-3 py-1 text-sm text-primary hover:bg-primary/8"
                  >
                    查看
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M4.5 6.375A4.125 4.125 0 1 1 8.625 10.5 4.125 4.125 0 0 1 4.5 6.375ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873 13.067 13.067 0 0 1-6.76-1.873.75.75 0 0 1-.364-.63l-.001-.122Z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875 0A.75.75 0 0 1 8.25 6h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75ZM2.625 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0ZM7.5 12a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9A.75.75 0 0 1 7.5 12Zm-4.875 5.25a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875 0a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6" aria-hidden="true">
      <path fillRule="evenodd" d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-7 9a7 7 0 1 1 14 0H3Z" clipRule="evenodd" />
    </svg>
  );
}

/**
 * 房客頭像：有 photoUrl 就顯示圖片，否則 fallback 為通用人形 icon。
 * size 為直徑（px），統一頭像/容器大小。
 */
function TenantAvatar({
  name,
  photoUrl,
  size = 48,
}: {
  name: string;
  photoUrl: string | null;
  size?: number;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={`${name} 的個人照`}
        width={size}
        height={size}
        className="rounded-full object-cover ring-1 ring-outline-variant"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-primary-container text-on-primary-container"
      style={{ width: size, height: size }}
    >
      <UserIcon />
    </div>
  );
}
