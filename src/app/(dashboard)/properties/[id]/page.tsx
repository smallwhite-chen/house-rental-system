import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { computeUnitStatus, summarizeUnitStatuses } from "@/lib/unit-status";
import { computeContractStatus, CONTRACT_STATUS_META } from "@/lib/contract-status";
import { StatusChip } from "@/components/ui/StatusChip";
import { ImageGallery } from "@/components/ui/ImageGallery";
import { PropertyActions } from "./property-actions";
import { UnitsView } from "./units-view";
import { deleteProperty } from "../actions";
import type { ContractStatus, UnitType, UnitStatus } from "@/generated/prisma/client";

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
            orderBy: { signedDate: "desc" },
            include: {
              tenant: { select: { id: true, name: true, phone: true } },
              billingTerms: { select: { actualRent: true } },
            },
          },
        },
      },
    },
  });
  if (!property) notFound();

  const isWhole = property.kind === "WHOLE_BUILDING";
  const counts = summarizeUnitStatuses(property.units);
  const now = new Date();

  // WHOLE_BUILDING：只有 1 個隱形 Unit，房間數視為 0；合約掛在該 Unit 上
  const visibleUnitCount = isWhole ? 0 : property.units.length;
  const contractCount = isWhole
    ? property.units[0]?.contracts.length ?? 0
    : 0;

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
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl" aria-hidden="true">{isWhole ? "🏪" : "🏢"}</span>
              <h1 className="text-3xl font-medium text-on-surface">{property.name}</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isWhole
                    ? "bg-status-completed/12 text-status-completed"
                    : "bg-primary-container text-on-primary-container"
                }`}
              >
                {isWhole ? "整棟型" : "多單位型"}
              </span>
              <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs text-on-surface-variant">
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
            kind={property.kind}
            unitCount={visibleUnitCount}
            contractCount={contractCount}
            canEdit={canEdit}
            canDelete={canDelete}
            deleteAction={deleteProperty}
          />
        </div>

        {/* 狀態統計 */}
        <div className={`mt-6 grid gap-3 border-t border-outline-variant pt-4 ${isWhole ? "grid-cols-4" : "grid-cols-5"}`}>
          {!isWhole && <Stat label="總單位" value={counts.total} />}
          <Stat label="出租中" value={counts.rented} tone="rented" />
          <Stat label="空置" value={counts.vacant} tone="vacant" />
          <Stat label="整修中" value={counts.maintenance} tone="maintenance" />
          <Stat label="合約逾期" value={counts.overdue} tone="overdue" />
        </div>
      </header>

      {property.images.length > 0 && (
        <ImageGallery urls={property.images} title="🖼 房產圖片" />
      )}

      {isWhole ? (
        <WholePropertyContractView
          propertyId={property.id}
          contracts={(property.units[0]?.contracts ?? []) as WholeContract[]}
          now={now}
          canCreate={canEdit}
        />
      ) : (
        <MultiUnitView
          propertyId={property.id}
          units={property.units as MultiUnit[]}
          now={now}
          canCreateUnit={canCreateUnit}
        />
      )}
    </div>
  );
}

// ── 型別 ────────────────────────────────────────────────────────────────────

type MultiUnit = {
  id: string;
  number: string;
  floor: number;
  type: UnitType;
  baseRent: import("@/generated/prisma/client").Prisma.Decimal;
  area: number | null;
  images: string[];
  manualStatus: UnitStatus | null;
  contracts: WholeContract[];
};

type WholeContract = {
  id: string;
  startDate: Date;
  endDate: Date;
  signedDate: Date;
  manualStatus: ContractStatus | null;
  tenant: { id: string; name: string; phone: string };
  billingTerms: { actualRent: import("@/generated/prisma/client").Prisma.Decimal } | null;
};

// ── MULTI_UNIT 房產：房間列表 ─────────────────────────────────────────────────

function MultiUnitView({
  propertyId,
  units,
  now,
  canCreateUnit,
}: {
  propertyId: string;
  units: MultiUnit[];
  now: Date;
  canCreateUnit: boolean;
}) {
  const unitsForView = units.map((u) => {
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
      thumbnailUrl: u.images[0] ?? null,
      status,
      tenantName: liveContract?.tenant.name ?? null,
      actualRent: liveContract?.billingTerms ? Number(liveContract.billingTerms.actualRent) : null,
      endDate: liveContract?.endDate ?? null,
    };
  });

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-medium text-on-surface">房間清單</h2>
        {canCreateUnit && (
          <Link
            href={`/properties/${propertyId}/units/new`}
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
        <UnitsView propertyId={propertyId} units={unitsForView} />
      )}
    </section>
  );
}

// ── WHOLE_BUILDING 房產：目前合約 + 合約歷史 ──────────────────────────────────

function WholePropertyContractView({
  propertyId,
  contracts,
  now,
  canCreate,
}: {
  propertyId: string;
  contracts: WholeContract[];
  now: Date;
  canCreate: boolean;
}) {
  // 找「目前進行中或最近一份」合約：先找 ACTIVE/EXPIRED 的最新；沒有就拿最新的（已排序）
  const live = contracts.find((c) => {
    const status = computeContractStatus(c, now);
    return status === "ACTIVE" || status === "EXPIRED";
  });
  const current = live ?? contracts[0] ?? null;

  return (
    <>
      {/* 📋 目前合約 大區塊 */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-medium text-on-surface">📋 目前合約</h2>
          {canCreate && (
            <Link
              href={`/contracts/new?propertyId=${propertyId}`}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-on-primary shadow-sm hover:bg-primary/90"
            >
              <PlusIcon />
              新增合約
            </Link>
          )}
        </div>

        {!current ? (
          <div className="rounded-2xl bg-surface py-16 text-center text-sm text-on-surface-variant ring-1 ring-outline-variant">
            尚無合約紀錄，點上方「新增合約」建立第一份。
          </div>
        ) : (
          <CurrentContractCard contract={current} now={now} />
        )}
      </section>

      {/* 合約歷史 */}
      {contracts.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-medium text-on-surface">
            合約歷史（共 {contracts.length} 份）
          </h2>
          <ul className="overflow-hidden rounded-2xl bg-surface ring-1 ring-outline-variant divide-y divide-outline-variant">
            {contracts.map((c) => {
              const status = computeContractStatus(c, now);
              const meta = CONTRACT_STATUS_META[status];
              return (
                <li key={c.id}>
                  <Link
                    href={`/contracts/${c.id}`}
                    className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-surface-container"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-on-surface">{c.tenant.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-on-surface-variant">
                        {fmt(c.startDate)} ~ {fmt(c.endDate)}
                      </p>
                    </div>
                    {c.billingTerms && (
                      <p className="whitespace-nowrap text-sm text-on-surface">
                        NT$ {Number(c.billingTerms.actualRent).toLocaleString("zh-TW")} / 月
                      </p>
                    )}
                    <StatusChip tone={meta.tone} label={meta.label} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}

function CurrentContractCard({ contract, now }: { contract: WholeContract; now: Date }) {
  const status = computeContractStatus(contract, now);
  const meta = CONTRACT_STATUS_META[status];
  const rent = contract.billingTerms ? Number(contract.billingTerms.actualRent) : null;

  return (
    <div className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-on-surface-variant">房客</p>
          <Link
            href={`/tenants/${contract.tenant.id}`}
            className="mt-1 inline-block text-xl font-medium text-on-surface hover:text-primary hover:underline"
          >
            {contract.tenant.name}
          </Link>
          <p className="mt-0.5 text-sm text-on-surface-variant">{contract.tenant.phone}</p>
        </div>
        <StatusChip tone={meta.tone} label={meta.label} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3 border-t border-outline-variant pt-4">
        <div>
          <p className="text-xs text-on-surface-variant">合約期間</p>
          <p className="mt-1 font-mono text-sm text-on-surface">
            {fmt(contract.startDate)} ~ {fmt(contract.endDate)}
          </p>
        </div>
        <div>
          <p className="text-xs text-on-surface-variant">月租金</p>
          <p className="mt-1 text-sm font-medium text-on-surface">
            {rent != null ? `NT$ ${rent.toLocaleString("zh-TW")}` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-on-surface-variant">簽約日</p>
          <p className="mt-1 font-mono text-sm text-on-surface">{fmt(contract.signedDate)}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          href={`/contracts/${contract.id}`}
          className="text-sm text-primary hover:underline"
        >
          查看合約詳細 →
        </Link>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

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

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
    </svg>
  );
}
