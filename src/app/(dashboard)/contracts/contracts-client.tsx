"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SelectChevron } from "@/components/ui/Select";
import { StatusChip } from "@/components/ui/StatusChip";
import { CONTRACT_STATUS_META } from "@/lib/contract-status";
import type { ContractStatus } from "@/generated/prisma/client";

type ContractRow = {
  id: string;
  propertyId: string;
  unitLabel: string;
  unitNumber: string;
  tenantName: string;
  tenantPhone: string;
  startDate: string;
  endDate: string;
  status: ContractStatus;
};

type PropertyOption = { id: string; name: string };

type Filter = "ALL" | ContractStatus;

const FILTER_TABS: Array<{ key: Filter; label: string }> = [
  { key: "ALL", label: "全部" },
  { key: "ACTIVE", label: "進行中" },
  { key: "EXPIRED", label: "已到期" },
  { key: "TERMINATED", label: "已終止" },
  { key: "COMPLETED", label: "已完成" },
];

export function ContractsClient({
  contracts,
  properties,
  canCreate,
}: {
  contracts: ContractRow[];
  properties: PropertyOption[];
  canCreate: boolean;
}) {
  const [view, setView] = useState<"card" | "list">("list");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [propertyId, setPropertyId] = useState<string>("ALL");
  const [query, setQuery] = useState("");

  // 先依「房產」篩選，剩下再算其他過濾與計數
  const propertyScoped = useMemo(
    () => (propertyId === "ALL" ? contracts : contracts.filter((c) => c.propertyId === propertyId)),
    [contracts, propertyId]
  );

  const filtered = useMemo(() => {
    return propertyScoped.filter((c) => {
      if (filter !== "ALL" && c.status !== filter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        return (
          c.unitNumber.toLowerCase().includes(q) ||
          c.unitLabel.toLowerCase().includes(q) ||
          c.tenantName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [propertyScoped, filter, query]);

  // 各 filter tab 的計數需反映「目前房產範圍」
  const counts = useMemo(() => ({
    ALL: propertyScoped.length,
    ACTIVE: propertyScoped.filter((c) => c.status === "ACTIVE").length,
    EXPIRED: propertyScoped.filter((c) => c.status === "EXPIRED").length,
    TERMINATED: propertyScoped.filter((c) => c.status === "TERMINATED").length,
    COMPLETED: propertyScoped.filter((c) => c.status === "COMPLETED").length,
  }), [propertyScoped]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-medium text-on-surface">合約管理</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            共 {contracts.length} 份合約（顯示 {filtered.length}）
          </p>
        </div>
        {canCreate && (
          <Link href="/contracts/new">
            <Button variant="filled" leadingIcon={<PlusIcon />}>新增合約</Button>
          </Link>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋房間編號或房客姓名…"
            className="block w-full rounded-full border-0 bg-surface px-5 py-2.5 text-sm text-on-surface ring-1 ring-inset ring-outline placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          />
        </div>
        <div className="relative">
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            aria-label="依房產篩選"
            className="appearance-none rounded-full border-0 bg-surface pl-5 pr-10 py-2.5 text-sm text-on-surface ring-1 ring-inset ring-outline focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          >
            <option value="ALL">所有房產（{contracts.length}）</option>
            {properties.map((p) => {
              const count = contracts.filter((c) => c.propertyId === p.id).length;
              return (
                <option key={p.id} value={p.id}>
                  {p.name}（{count}）
                </option>
              );
            })}
          </select>
          <SelectChevron />
        </div>
        <div className="flex flex-wrap gap-1 rounded-full bg-surface-container-high p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
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
          {contracts.length === 0
            ? "尚無合約，請點擊右上角「新增合約」建立第一份。"
            : "此篩選條件下無合約。"}
        </div>
      ) : view === "card" ? (
        <CardView rows={filtered} />
      ) : (
        <ListView rows={filtered} />
      )}
    </div>
  );
}

function CardView({ rows }: { rows: ContractRow[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((c) => {
        const meta = CONTRACT_STATUS_META[c.status];
        return (
          <Link
            key={c.id}
            href={`/contracts/${c.id}`}
            className="block rounded-2xl bg-surface p-5 ring-1 ring-outline-variant transition-all hover:shadow-md hover:ring-primary/40"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">房間</p>
                <p className="font-medium text-on-surface">{c.unitLabel}</p>
              </div>
              <StatusChip tone={meta.tone} label={meta.label} />
            </div>
            <div className="mt-3">
              <p className="text-xs uppercase tracking-wide text-on-surface-variant">房客</p>
              <p className="font-medium text-on-surface">{c.tenantName}</p>
              <p className="text-xs text-on-surface-variant">{c.tenantPhone}</p>
            </div>
            <div className="mt-3 font-mono text-xs text-on-surface-variant">
              {c.startDate} ~ {c.endDate}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ListView({ rows }: { rows: ContractRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-outline-variant">
      <table className="w-full">
        <thead className="bg-surface-container-high text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
          <tr>
            <th className="px-6 py-3">房間</th>
            <th className="px-6 py-3">房客</th>
            <th className="px-6 py-3">開始日</th>
            <th className="px-6 py-3">結束日</th>
            <th className="px-6 py-3">狀態</th>
            <th className="px-6 py-3 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
          {rows.map((c) => {
            const meta = CONTRACT_STATUS_META[c.status];
            return (
              <tr key={c.id} className="transition-colors hover:bg-surface-container">
                <td className="px-6 py-4 font-medium">{c.unitLabel}</td>
                <td className="px-6 py-4">
                  <div className="font-medium">{c.tenantName}</div>
                  <div className="text-xs text-on-surface-variant">{c.tenantPhone}</div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{c.startDate}</td>
                <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{c.endDate}</td>
                <td className="px-6 py-4"><StatusChip tone={meta.tone} label={meta.label} /></td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <Link
                    href={`/contracts/${c.id}`}
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
      <path fillRule="evenodd" d="M3 4.5A1.5 1.5 0 0 1 4.5 3h3A1.5 1.5 0 0 1 9 4.5v3A1.5 1.5 0 0 1 7.5 9h-3A1.5 1.5 0 0 1 3 7.5v-3Zm0 8A1.5 1.5 0 0 1 4.5 11h3A1.5 1.5 0 0 1 9 12.5v3A1.5 1.5 0 0 1 7.5 17h-3A1.5 1.5 0 0 1 3 15.5v-3Zm8-8A1.5 1.5 0 0 1 12.5 3h3A1.5 1.5 0 0 1 17 4.5v3A1.5 1.5 0 0 1 15.5 9h-3A1.5 1.5 0 0 1 11 7.5v-3Zm0 8a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5v-3Z" clipRule="evenodd" />
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
