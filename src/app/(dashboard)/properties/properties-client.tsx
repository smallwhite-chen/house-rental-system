"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import type { UnitStatusCounts } from "@/lib/unit-status";
import type { PropertyKind } from "@/generated/prisma/client";
import { PropertyKindModal } from "./property-kind-modal";

type PropertyCard = {
  id: string;
  kind: PropertyKind;
  name: string;
  typeName: string;
  city: string;
  district: string;
  address: string;
  /** 整棟型房產：首張圖片 URL；無圖或多單位型為 null */
  thumbnailUrl: string | null;
  counts: UnitStatusCounts;
};

type ViewMode = "card" | "list";

export function PropertiesClient({
  items,
  canCreate,
}: {
  items: PropertyCard[];
  canCreate: boolean;
}) {
  const [view, setView] = useState<ViewMode>("card");
  const [search, setSearch] = useState("");
  const [showKindModal, setShowKindModal] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) =>
      [p.name, p.city, p.district, p.address, p.typeName]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [items, search]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-medium text-on-surface">房產管理</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            管理公司旗下房產（共 {items.length} 棟）
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowKindModal(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-on-primary shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <PlusIcon />
            新增房產
          </button>
        )}
      </header>

      {/* Toolbar */}
      <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 ring-1 ring-outline-variant">
        <div className="relative flex-1">
          <SearchIcon />
          <input
            type="search"
            placeholder="搜尋房產名稱、地址、種類…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-surface-container-high py-2 pl-9 pr-3 text-sm text-on-surface ring-1 ring-outline placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex rounded-full bg-surface-container-high p-1">
          <ViewToggleButton current={view} mode="card" onClick={() => setView("card")} />
          <ViewToggleButton current={view} mode="list" onClick={() => setView("list")} />
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-surface py-16 text-center text-sm text-on-surface-variant ring-1 ring-outline-variant">
          {items.length === 0
            ? "尚無房產，請點擊右上角「新增房產」建立第一棟。"
            : `找不到符合「${search}」的房產`}
        </div>
      ) : view === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => <PropertyCardView key={p.id} property={p} />)}
        </div>
      ) : (
        <PropertyListView properties={filtered} />
      )}

      {showKindModal && <PropertyKindModal onClose={() => setShowKindModal(false)} />}
    </div>
  );
}

// ── Card View ──────────────────────────────────────────────────────────────
function PropertyCardView({ property }: { property: PropertyCard }) {
  const { counts, kind } = property;
  const isWhole = kind === "WHOLE_BUILDING";
  return (
    <Link
      href={`/properties/${property.id}`}
      className="block rounded-2xl bg-surface p-5 ring-1 ring-outline-variant transition-all hover:shadow-md hover:ring-primary/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          {/* 整棟型：有圖顯示縮圖、無圖 fallback emoji；多單位型：emoji */}
          {isWhole ? (
            property.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={property.thumbnailUrl}
                alt={`${property.name} 縮圖`}
                className="h-12 w-12 flex-shrink-0 rounded-lg object-cover ring-1 ring-outline-variant"
              />
            ) : (
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-status-completed/12 text-2xl">
                🏪
              </div>
            )
          ) : (
            <span className="text-lg" aria-hidden="true">🏢</span>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-on-surface">{property.name}</p>
            <p className="mt-0.5 text-xs text-on-surface-variant">{property.typeName}</p>
          </div>
        </div>
        <span className="whitespace-nowrap rounded-full bg-surface-container-high px-2 py-0.5 text-xs text-on-surface-variant">
          {isWhole ? "整棟" : `${counts.total} 個單位`}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-on-surface-variant">
        {property.city}{property.district}・{property.address}
      </p>

      <div className="mt-4 grid grid-cols-4 gap-2 border-t border-outline-variant pt-3">
        <CountCell label="出租中" value={counts.rented} tone="rented" />
        <CountCell label="空置" value={counts.vacant} tone="vacant" />
        <CountCell label="整修中" value={counts.maintenance} tone="maintenance" />
        <CountCell label="逾期" value={counts.overdue} tone="overdue" />
      </div>
    </Link>
  );
}

function CountCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "rented" | "vacant" | "maintenance" | "overdue";
}) {
  const TONE_TEXT: Record<typeof tone, string> = {
    rented: "text-status-rented",
    vacant: "text-status-vacant",
    maintenance: "text-status-maintenance",
    overdue: "text-status-overdue",
  };
  return (
    <div className="text-center">
      <p className={`text-lg font-medium ${value > 0 ? TONE_TEXT[tone] : "text-on-surface-variant/50"}`}>
        {value}
      </p>
      <p className="text-[10px] text-on-surface-variant">{label}</p>
    </div>
  );
}

// ── List View ──────────────────────────────────────────────────────────────
function PropertyListView({ properties }: { properties: PropertyCard[] }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-outline-variant">
      <table className="w-full text-sm">
        <thead className="bg-surface-container-high text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
          <tr>
            <th className="px-6 py-3">房產名稱</th>
            <th className="px-6 py-3">種類</th>
            <th className="px-6 py-3">地址</th>
            <th className="px-6 py-3 text-center">單位數</th>
            <th className="px-6 py-3 text-center">出租</th>
            <th className="px-6 py-3 text-center">空置</th>
            <th className="px-6 py-3 text-center">整修</th>
            <th className="px-6 py-3 text-center">逾期</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {properties.map((p) => {
            const isWhole = p.kind === "WHOLE_BUILDING";
            return (
              <tr key={p.id} className="hover:bg-surface-container">
                <td className="px-6 py-4">
                  <Link href={`/properties/${p.id}`} className="flex items-center gap-2 font-medium text-on-surface hover:text-primary hover:underline">
                    <span aria-hidden="true">{isWhole ? "🏪" : "🏢"}</span>
                    {p.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-on-surface-variant">{p.typeName}</td>
                <td className="px-6 py-4 text-on-surface-variant">
                  {p.city}{p.district}・{p.address}
                </td>
                <td className="px-6 py-4 text-center text-on-surface">
                  {isWhole ? "整棟" : p.counts.total}
                </td>
                <td className={`px-6 py-4 text-center ${p.counts.rented > 0 ? "text-status-rented" : "text-on-surface-variant/50"}`}>{p.counts.rented}</td>
                <td className={`px-6 py-4 text-center ${p.counts.vacant > 0 ? "text-status-vacant" : "text-on-surface-variant/50"}`}>{p.counts.vacant}</td>
                <td className={`px-6 py-4 text-center ${p.counts.maintenance > 0 ? "text-status-maintenance" : "text-on-surface-variant/50"}`}>{p.counts.maintenance}</td>
                <td className={`px-6 py-4 text-center ${p.counts.overdue > 0 ? "text-status-overdue" : "text-on-surface-variant/50"}`}>{p.counts.overdue}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Icons & View Toggle ────────────────────────────────────────────────────
function ViewToggleButton({ current, mode, onClick }: { current: ViewMode; mode: ViewMode; onClick: () => void }) {
  const active = current === mode;
  return (
    <button
      onClick={onClick}
      aria-label={mode === "card" ? "卡片檢視" : "列表檢視"}
      className={`flex h-7 w-9 items-center justify-center rounded-full transition-colors ${
        active ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"
      }`}
    >
      {mode === "card" ? <GridIcon /> : <ListIcon />}
    </button>
  );
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M3 4.25A1.25 1.25 0 0 1 4.25 3h3.5A1.25 1.25 0 0 1 9 4.25v3.5A1.25 1.25 0 0 1 7.75 9h-3.5A1.25 1.25 0 0 1 3 7.75v-3.5Zm8 0A1.25 1.25 0 0 1 12.25 3h3.5A1.25 1.25 0 0 1 17 4.25v3.5A1.25 1.25 0 0 1 15.75 9h-3.5A1.25 1.25 0 0 1 11 7.75v-3.5Zm-8 8A1.25 1.25 0 0 1 4.25 11h3.5A1.25 1.25 0 0 1 9 12.25v3.5A1.25 1.25 0 0 1 7.75 17h-3.5A1.25 1.25 0 0 1 3 15.75v-3.5Zm8 0A1.25 1.25 0 0 1 12.25 11h3.5A1.25 1.25 0 0 1 17 12.25v3.5A1.25 1.25 0 0 1 15.75 17h-3.5A1.25 1.25 0 0 1 11 15.75v-3.5Z" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" aria-hidden="true">
      <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
    </svg>
  );
}
