import type { Metadata } from "next";
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
    kind: p.kind,
    name: p.name,
    typeName: p.propertyType.name,
    city: p.city,
    district: p.district,
    address: p.address,
    counts: summarizeUnitStatuses(p.units),
  }));

  return <PropertiesClient items={items} canCreate={canCreate} />;
}
