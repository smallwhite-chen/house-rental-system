"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { SelectChevron } from "@/components/ui/Select";
import { COMMUNICATION_STATUS_META } from "@/lib/communication-status";
import type { CommunicationStatus } from "@/generated/prisma/client";

type LogRow = {
  id: string;
  communicationDate: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitNumber: string;
  tenantName: string;
  tags: { id: string; name: string }[];
  status: CommunicationStatus;
  content: string;
  attachmentUrl: string | null;
  note: string | null;
};

type Option = { id: string; name: string };

type StatusFilter = "ALL" | CommunicationStatus;
type ViewMode = "timeline" | "byUnit";

export function CommunicationsClient({
  logs,
  properties,
  tags,
  canCreate,
}: {
  logs: LogRow[];
  properties: Option[];
  tags: Option[];
  canCreate: boolean;
}) {
  const [view, setView] = useState<ViewMode>("timeline");
  const [query, setQuery] = useState("");
  const [propertyId, setPropertyId] = useState<string>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function toggleTag(id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  function clearAll() {
    setQuery("");
    setPropertyId("ALL");
    setStatus("ALL");
    setSelectedTagIds([]);
    setFrom("");
    setTo("");
  }

  const hasAnyFilter =
    !!query ||
    propertyId !== "ALL" ||
    status !== "ALL" ||
    selectedTagIds.length > 0 ||
    !!from ||
    !!to;

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (propertyId !== "ALL" && log.propertyId !== propertyId) return false;
      if (status !== "ALL" && log.status !== status) return false;
      if (from && log.communicationDate < from) return false;
      if (to && log.communicationDate > to) return false;
      if (selectedTagIds.length > 0) {
        // 任一標籤命中即過（OR 邏輯，常見體驗）
        const logTagIds = log.tags.map((t) => t.id);
        if (!selectedTagIds.some((id) => logTagIds.includes(id))) return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const haystack = `${log.unitNumber} ${log.tenantName} ${log.content} ${log.propertyName}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [logs, propertyId, status, selectedTagIds, from, to, query]);

  // 依房間分組（保留時間排序）
  const grouped = useMemo(() => {
    const map = new Map<string, { unitId: string; unitNumber: string; propertyName: string; tenantName: string; rows: LogRow[] }>();
    for (const log of filtered) {
      const key = log.unitId;
      const existing = map.get(key);
      if (existing) {
        existing.rows.push(log);
      } else {
        map.set(key, {
          unitId: log.unitId,
          unitNumber: log.unitNumber,
          propertyName: log.propertyName,
          tenantName: log.tenantName,
          rows: [log],
        });
      }
    }
    return Array.from(map.values());
  }, [filtered]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-medium text-on-surface">溝通與維修</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            共 {logs.length} 筆紀錄（顯示 {filtered.length}）
          </p>
        </div>
        {canCreate && (
          <Link href="/communications/new">
            <Button variant="filled" leadingIcon={<PlusIcon />}>新增紀錄</Button>
          </Link>
        )}
      </header>

      {/* 篩選列 */}
      <div className="space-y-3 rounded-2xl bg-surface p-4 ring-1 ring-outline-variant">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋房間、房客、內容…"
              className="block w-full rounded-full border-0 bg-surface px-5 py-2.5 text-sm text-on-surface ring-1 ring-inset ring-outline placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            />
          </div>
          {/* 檢視模式 */}
          <div className="flex gap-1 rounded-full bg-surface-container-high p-1">
            <button
              onClick={() => setView("timeline")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                view === "timeline" ? "bg-primary text-on-primary" : "text-on-surface-variant"
              }`}
            >
              依時間軸
            </button>
            <button
              onClick={() => setView("byUnit")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                view === "byUnit" ? "bg-primary text-on-primary" : "text-on-surface-variant"
              }`}
            >
              依房間
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <FilterSelect label="房產" value={propertyId} onChange={setPropertyId}>
            <option value="ALL">全部</option>
            {properties.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </FilterSelect>

          <FilterSelect label="處理狀態" value={status} onChange={(v) => setStatus(v as StatusFilter)}>
            <option value="ALL">全部</option>
            <option value="PENDING">待處理</option>
            <option value="IN_PROGRESS">處理中</option>
            <option value="COMPLETED">已完成</option>
          </FilterSelect>

          <FilterDate label="起始日" value={from} onChange={setFrom} />
          <FilterDate label="結束日" value={to} onChange={setTo} />

          {hasAnyFilter && (
            <button
              type="button"
              onClick={clearAll}
              className="self-end rounded-full px-3 py-2 text-sm text-primary hover:bg-primary/8"
            >
              清除篩選
            </button>
          )}
        </div>

        {/* 標籤多選 chips */}
        {tags.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-on-surface-variant">標籤（多選；任一命中即顯示）</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const selected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selected
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-high text-on-surface-variant ring-1 ring-outline hover:bg-surface-container"
                    }`}
                  >
                    {selected && <span className="mr-1">✓</span>}
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-surface py-16 text-center text-sm text-on-surface-variant ring-1 ring-outline-variant">
          {logs.length === 0 ? "尚無溝通紀錄。" : "此篩選條件下無紀錄。"}
        </div>
      ) : view === "timeline" ? (
        <TimelineView rows={filtered} />
      ) : (
        <ByUnitView groups={grouped} />
      )}
    </div>
  );
}

// ── Timeline 檢視 ────────────────────────────────────────────────────────────
function TimelineView({ rows }: { rows: LogRow[] }) {
  return (
    <ol className="relative ml-3 space-y-4 border-l-2 border-outline-variant pl-6">
      {rows.map((log) => {
        const meta = COMMUNICATION_STATUS_META[log.status];
        return (
          <li key={log.id} className="relative">
            <span className="absolute -left-[31px] top-2 h-3 w-3 rounded-full bg-primary ring-4 ring-surface" />
            <Link
              href={`/communications/${log.id}/edit`}
              className="block rounded-2xl bg-surface p-4 ring-1 ring-outline-variant transition-all hover:shadow-md hover:ring-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-mono text-on-surface-variant">{log.communicationDate}</span>
                    <span className="text-outline">·</span>
                    <span className="font-medium text-on-surface">{log.propertyName} {log.unitNumber}</span>
                    <span className="text-outline">·</span>
                    <span className="text-on-surface-variant">{log.tenantName}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-on-surface">{log.content}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {log.tags.map((t) => (
                      <span key={t.id} className="rounded-full bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant">
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
                <StatusChip tone={meta.tone} label={meta.label} />
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

// ── 依房間檢視 ───────────────────────────────────────────────────────────────
function ByUnitView({
  groups,
}: {
  groups: {
    unitId: string;
    unitNumber: string;
    propertyName: string;
    tenantName: string;
    rows: LogRow[];
  }[];
}) {
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.unitId} className="rounded-2xl bg-surface p-5 ring-1 ring-outline-variant">
          <header className="mb-3 flex items-baseline gap-3 border-b border-outline-variant pb-3">
            <h2 className="text-lg font-medium text-on-surface">
              {g.propertyName} {g.unitNumber}
            </h2>
            <span className="text-sm text-on-surface-variant">{g.tenantName}</span>
            <span className="ml-auto text-xs text-on-surface-variant">{g.rows.length} 筆</span>
          </header>
          <ol className="space-y-2">
            {g.rows.map((log) => {
              const meta = COMMUNICATION_STATUS_META[log.status];
              return (
                <li key={log.id}>
                  <Link
                    href={`/communications/${log.id}/edit`}
                    className="block rounded-xl bg-surface-container p-3 transition-colors hover:bg-surface-container-high"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                          <span className="font-mono">{log.communicationDate}</span>
                          {log.tags.map((t) => (
                            <span key={t.id} className="rounded-full bg-surface px-2 py-0.5">
                              {t.name}
                            </span>
                          ))}
                        </div>
                        <p className="mt-1 line-clamp-1 text-sm text-on-surface">{log.content}</p>
                      </div>
                      <StatusChip tone={meta.tone} label={meta.label} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

// ── 共用小元件 ────────────────────────────────────────────────────────────────

function FilterSelect({
  label, value, onChange, children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-on-surface-variant">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block appearance-none rounded-lg bg-surface-container-high pl-3 pr-9 py-2 text-sm text-on-surface ring-1 ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {children}
        </select>
        <SelectChevron />
      </div>
    </div>
  );
}

function FilterDate({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-on-surface-variant">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface ring-1 ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
      />
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
