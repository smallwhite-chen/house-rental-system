import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { computeUnitStatus, summarizeUnitStatuses, UNIT_STATUS_META } from "@/lib/unit-status";
import { StatusChip } from "@/components/ui/StatusChip";
import { PropertyActions } from "./property-actions";
import { UnitsView } from "./units-view";
import { deleteProperty } from "../actions";

export const metadata: Metadata = {
  title: "房產詳細 ｜ 房屋租賃管理系統",
};

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePermission("PROPERTIES", "VIEW");
  const canEdit = hasPermission(ctx, "PROPERTIES", "EDIT");
  const canDelete = hasPermission(ctx, "PROPERTIES", "DELETE");
  const canCreateUnit = canEdit;

  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      propertyType: { select: { name: true } },
      units: {
        orderBy: [{ floor: "asc" }, { number: "asc" }],
        include: {
          contracts: {
            select: {
              startDate: true,
              endDate: true,
              manualStatus: true,
              tenant: { select: { name: true } },
              billingTerms: { select: { actualRent: true } },
            },
          },
        },
      },
    },
  });
  if (!property) notFound();

  const counts = summarizeUnitStatuses(property.units);
  const now = new Date();

  // 把房間轉換成 client 需要的格式（含目前狀態 / 房客 / 合約租金 / 到期日）
  const unitsForView = property.units.map((u) => {
    const status = computeUnitStatus(u, now);
    const liveContract = u.contracts.find(
      (c) =>
        c.manualStatus !== "TERMINATED" &&
        c.manualStatus !== "COMPLETED" &&
        c.startDate <= now &&
        now <= c.endDate
    );
    return {
      id: u.id,
      number: u.number,
      floor: u.floor,
      type: u.type,
      baseRent: Number(u.baseRent),
      area: u.area,
      status,
      tenantName: liveContract?.tenant.name ?? null,
      actualRent: liveContract?.billingTerms ? Number(liveContract.billingTerms.actualRent) : null,
      endDate: liveContract?.endDate ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/properties" className="hover:text-on-surface hover:underline">房產管理</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">{property.name}</li>
        </ol>
      </nav>

      {/* 房產資訊卡 */}
      <header className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-medium text-on-surface">{property.name}</h1>
              <span className="rounded-full bg-primary-container px-2.5 py-0.5 text-xs font-medium text-on-primary-container">
                {property.propertyType.name}
              </span>
            </div>
            <p className="mt-2 text-sm text-on-surface-variant">
              {property.city}{property.district}・{property.address}
            </p>
            {(property.buildYear || property.totalFloors) && (
              <p className="mt-1 text-xs text-on-surface-variant">
                {property.buildYear && `${property.buildYear} 年`}
                {property.buildYear && property.totalFloors && "・"}
                {property.totalFloors && `共 ${property.totalFloors} 層`}
              </p>
            )}
            {property.note && (
              <p className="mt-3 text-sm text-on-surface-variant border-t border-outline-variant pt-3">
                {property.note}
              </p>
            )}
          </div>
          <PropertyActions
            propertyId={property.id}
            propertyName={property.name}
            unitCount={counts.total}
            canEdit={canEdit}
            canDelete={canDelete}
            deleteAction={deleteProperty}
          />
        </div>

        {/* 狀態統計 */}
        <div className="mt-6 grid grid-cols-5 gap-3 border-t border-outline-variant pt-4">
          <Stat label="總房間" value={counts.total} />
          <Stat label="出租中" value={counts.rented} tone="rented" />
          <Stat label="空置" value={counts.vacant} tone="vacant" />
          <Stat label="整修中" value={counts.maintenance} tone="maintenance" />
          <Stat label="合約逾期" value={counts.overdue} tone="overdue" />
        </div>
      </header>

      {/* 房間清單 */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-medium text-on-surface">房間清單</h2>
          {canCreateUnit && (
            <Link
              href={`/properties/${id}/units/new`}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-on-primary shadow-sm hover:bg-primary/90"
            >
              <PlusIcon />
              新增房間
            </Link>
          )}
        </div>

        {unitsForView.length === 0 ? (
          <div className="rounded-2xl bg-surface py-16 text-center text-sm text-on-surface-variant ring-1 ring-outline-variant">
            尚無房間，請點擊右上角「新增房間」建立第一間。
          </div>
        ) : (
          <UnitsView propertyId={id} units={unitsForView} />
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "rented" | "vacant" | "maintenance" | "overdue";
}) {
  const TONE_TEXT: Record<NonNullable<typeof tone>, string> = {
    rented: "text-status-rented",
    vacant: "text-status-vacant",
    maintenance: "text-status-maintenance",
    overdue: "text-status-overdue",
  };
  return (
    <div className="text-center">
      <p className={`text-2xl font-medium ${tone ? TONE_TEXT[tone] : "text-on-surface"}`}>{value}</p>
      <p className="mt-1 text-xs text-on-surface-variant">{label}</p>
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
