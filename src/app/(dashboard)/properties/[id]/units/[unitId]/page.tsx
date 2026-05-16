import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { computeUnitStatus, UNIT_STATUS_META } from "@/lib/unit-status";
import { StatusChip } from "@/components/ui/StatusChip";
import { UnitForm } from "../unit-form";
import { UnitDeleteButton } from "./unit-delete-button";
import { updateUnit, deleteUnit } from "../actions";

export const metadata: Metadata = {
  title: "房間詳細 ｜ 房屋租賃管理系統",
};

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const ctx = await requirePermission("PROPERTIES", "VIEW");
  const canEdit = hasPermission(ctx, "PROPERTIES", "EDIT");
  const canDelete = hasPermission(ctx, "PROPERTIES", "DELETE");

  const { id, unitId } = await params;
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: {
      property: { select: { id: true, name: true, totalFloors: true } },
      contracts: {
        select: { startDate: true, endDate: true, manualStatus: true },
      },
    },
  });
  if (!unit || unit.propertyId !== id) notFound();

  const status = computeUnitStatus(unit);
  const meta = UNIT_STATUS_META[status];
  const contractCount = unit.contracts.length;

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/properties" className="hover:text-on-surface hover:underline">房產管理</Link></li>
          <li aria-hidden="true">›</li>
          <li><Link href={`/properties/${id}`} className="hover:text-on-surface hover:underline">{unit.property.name}</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">房號 {unit.number}</li>
        </ol>
      </nav>

      <header className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-medium text-on-surface">房號 {unit.number}</h1>
            <StatusChip tone={meta.tone} label={meta.label} />
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">
            {unit.floor} 樓・{unit.type === "SUITE" ? "套房" : "雅房"}
            {unit.area ? `・${unit.area} 坪` : ""}
          </p>
        </div>
        {canDelete && (
          <UnitDeleteButton
            unitId={unit.id}
            unitNumber={unit.number}
            contractCount={contractCount}
            propertyId={id}
            deleteAction={deleteUnit}
          />
        )}
      </header>

      {!canEdit ? (
        <div className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant text-sm text-on-surface-variant">
          您沒有編輯房間的權限。
        </div>
      ) : (
        <UnitForm
          propertyId={id}
          totalFloors={unit.property.totalFloors}
          initial={{
            number: unit.number,
            floor: unit.floor,
            type: unit.type,
            area: unit.area,
            baseRent: Number(unit.baseRent),
            note: unit.note,
            manualMaintenance: unit.manualStatus === "MAINTENANCE",
          }}
          submitLabel="儲存變更"
          allowManualStatus={true}
          onSubmit={updateUnit.bind(null, unit.id)}
        />
      )}
    </div>
  );
}
