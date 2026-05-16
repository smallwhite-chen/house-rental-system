import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { summarizeUnitStatuses } from "@/lib/unit-status";
import { PropertiesClient } from "./properties-client";

export const metadata: Metadata = {
  title: "房產管理 ｜ 房屋租賃管理系統",
};

export default async function PropertiesListPage() {
  const ctx = await requirePermission("PROPERTIES", "VIEW");
  const canCreate = hasPermission(ctx, "PROPERTIES", "CREATE");

  // 一次撈出所有房產 + 房間 + 用於狀態計算的合約欄位
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      propertyType: { select: { name: true } },
      units: {
        select: {
          id: true,
          manualStatus: true,
          contracts: {
            select: { startDate: true, endDate: true, manualStatus: true },
          },
        },
      },
    },
  });

  // 每個房產換算成卡片需要的精簡資料
  const items = properties.map((p) => ({
    id: p.id,
    name: p.name,
    typeName: p.propertyType.name,
    city: p.city,
    district: p.district,
    address: p.address,
    counts: summarizeUnitStatuses(p.units),
  }));

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
          <Link href="/properties/new">
            <button className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-on-primary shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <PlusIcon />
              新增房產
            </button>
          </Link>
        )}
      </header>

      <PropertiesClient items={items} />
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
