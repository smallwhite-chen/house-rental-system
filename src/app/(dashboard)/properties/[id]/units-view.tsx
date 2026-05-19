"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { StatusChip } from "@/components/ui/StatusChip";
import { UNIT_STATUS_META } from "@/lib/unit-status";
import type { UnitStatus, UnitType } from "@/generated/prisma/client";

type UnitView = {
  id: string;
  number: string;
  floor: number;
  type: UnitType;
  baseRent: number;
  area: number | null;
  thumbnailUrl: string | null;
  status: UnitStatus;
  tenantName: string | null;
  actualRent: number | null;
  endDate: Date | null;
};

type ViewMode = "card" | "list";

function fmtMoney(v: number | null) {
  if (v === null) return "—";
  return `NT$ ${v.toLocaleString("zh-TW")}`;
}

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("zh-TW");
}

const UNIT_TYPE_LABEL: Record<UnitType, string> = { SUITE: "套房", ROOM: "雅房" };

export function UnitsView({ propertyId, units }: { propertyId: string; units: UnitView[] }) {
  const [view, setView] = useState<ViewMode>("card");

  // 依樓層分組
  const grouped = useMemo(() => {
    const m = new Map<number, UnitView[]>();
    for (const u of units) {
      const arr = m.get(u.floor) ?? [];
      arr.push(u);
      m.set(u.floor, arr);
    }
    return Array.from(m.entries()).sort(([a], [b]) => b - a); // 從高樓到低樓
  }, [units]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex rounded-full bg-surface-container-high p-1">
          <ToggleBtn active={view === "card"} onClick={() => setView("card")} ariaLabel="卡片檢視"><GridIcon /></ToggleBtn>
          <ToggleBtn active={view === "list"} onClick={() => setView("list")} ariaLabel="列表檢視"><ListIcon /></ToggleBtn>
        </div>
      </div>

      {view === "card" ? (
        <div className="space-y-6">
          {grouped.map(([floor, floorUnits]) => (
            <div key={floor}>
              <h3 className="mb-3 text-sm font-medium text-on-surface-variant">{floor} 樓 · {floorUnits.length} 間</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {floorUnits.map((u) => <UnitCard key={u.id} propertyId={propertyId} unit={u} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-outline-variant">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-high text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">房號</th>
                <th className="px-4 py-3">樓層</th>
                <th className="px-4 py-3">類型</th>
                <th className="px-4 py-3">狀態</th>
                <th className="px-4 py-3">房客</th>
                <th className="px-4 py-3 text-right">基本租金</th>
                <th className="px-4 py-3 text-right">合約租金</th>
                <th className="px-4 py-3 whitespace-nowrap">合約到期</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {units.map((u) => {
                const meta = UNIT_STATUS_META[u.status];
                return (
                  <tr key={u.id} className="hover:bg-surface-container">
                    <td className="px-4 py-3">
                      <Link href={`/properties/${propertyId}/units/${u.id}`} className="font-medium text-on-surface hover:text-primary hover:underline">
                        {u.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{u.floor} 樓</td>
                    <td className="px-4 py-3 text-on-surface-variant">{UNIT_TYPE_LABEL[u.type]}</td>
                    <td className="px-4 py-3"><StatusChip tone={meta.tone} label={meta.label} /></td>
                    <td className="px-4 py-3 text-on-surface-variant">{u.tenantName ?? <span className="text-outline">—</span>}</td>
                    <td className="px-4 py-3 text-right text-on-surface-variant">{fmtMoney(u.baseRent)}</td>
                    <td className="px-4 py-3 text-right text-on-surface-variant">{fmtMoney(u.actualRent)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-on-surface-variant">{fmtDate(u.endDate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UnitCard({ propertyId, unit }: { propertyId: string; unit: UnitView }) {
  const meta = UNIT_STATUS_META[unit.status];
  return (
    <Link
      href={`/properties/${propertyId}/units/${unit.id}`}
      className="block rounded-2xl bg-surface p-4 ring-1 ring-outline-variant transition-all hover:shadow-md hover:ring-primary/40"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* 第一張房間圖片縮圖；無則灰色預留方塊 */}
          {unit.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={unit.thumbnailUrl}
              alt={`${unit.number} 房間照片`}
              className="h-12 w-12 flex-shrink-0 rounded-lg object-cover ring-1 ring-outline-variant"
            />
          ) : (
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant ring-1 ring-outline-variant">
              <PlaceholderIcon />
            </div>
          )}
          <span className="text-lg font-medium text-on-surface truncate">{unit.number}</span>
        </div>
        <StatusChip tone={meta.tone} label={meta.label} />
      </div>
      <p className="mt-2 text-xs text-on-surface-variant">
        {UNIT_TYPE_LABEL[unit.type]}{unit.area ? ` · ${unit.area} 坪` : ""}
      </p>

      <div className="mt-3 space-y-1 border-t border-outline-variant pt-3 text-xs">
        <Row label="房客" value={unit.tenantName ?? "—"} />
        <Row label="基本租金" value={fmtMoney(unit.baseRent)} />
        <Row label="合約租金" value={fmtMoney(unit.actualRent)} />
        <Row label="合約到期" value={fmtDate(unit.endDate)} />
      </div>
    </Link>
  );
}

function PlaceholderIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 opacity-50" aria-hidden="true">
      <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
    </svg>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-on-surface-variant">
      <span>{label}</span>
      <span className="text-on-surface">{value}</span>
    </div>
  );
}

function ToggleBtn({ active, onClick, ariaLabel, children }: { active: boolean; onClick: () => void; ariaLabel: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`flex h-7 w-9 items-center justify-center rounded-full transition-colors ${
        active ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"
      }`}
    >
      {children}
    </button>
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
