import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { computeTenantStatus, getCurrentUnit, type TenantStatus } from "@/lib/tenant-status";
import { TenantsClient } from "./tenants-client";

export const metadata: Metadata = {
  title: "房客管理 ｜ 房屋租賃管理系統",
};

export default async function TenantsPage() {
  const ctx = await requirePermission("TENANTS", "VIEW");
  const canCreate = hasPermission(ctx, "TENANTS", "CREATE");

  const tenants = await prisma.tenant.findMany({
    orderBy: [{ name: "asc" }],
    include: {
      contracts: {
        select: {
          startDate: true,
          endDate: true,
          manualStatus: true,
          unit: {
            select: {
              number: true,
              property: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const now = new Date();
  const rows = tenants.map((t) => {
    const status: TenantStatus = computeTenantStatus(t.contracts, now);
    const currentUnit = getCurrentUnit(t.contracts, now);
    return {
      id: t.id,
      name: t.name,
      phone: t.phone,
      email: t.email,
      idNumberMasked: maskIdNumber(t.idNumber),
      photoUrl: t.photoUrl,
      status,
      currentUnitLabel: currentUnit
        ? `${currentUnit.propertyName} ${currentUnit.number}`
        : null,
      contractCount: t.contracts.length,
    };
  });

  return <TenantsClient tenants={rows} canCreate={canCreate} />;
}

function maskIdNumber(id: string): string {
  if (id.length < 4) return id;
  return id.slice(0, 1) + "*".repeat(id.length - 4) + id.slice(-3);
}
