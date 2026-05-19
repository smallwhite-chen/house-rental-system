import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { computeContractStatus } from "@/lib/contract-status";
import { ContractsClient } from "./contracts-client";

export const metadata: Metadata = {
  title: "合約管理 ｜ 房屋租賃管理系統",
};

export default async function ContractsPage() {
  const ctx = await requirePermission("CONTRACTS", "VIEW");
  const canCreate = hasPermission(ctx, "CONTRACTS", "CREATE");

  const [contracts, properties] = await Promise.all([
    prisma.contract.findMany({
      orderBy: [{ signedDate: "desc" }],
      include: {
        unit: {
          select: {
            number: true,
            property: { select: { id: true, name: true, kind: true } },
          },
        },
        tenant: { select: { name: true, phone: true } },
      },
    }),
    prisma.property.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const now = new Date();
  const rows = contracts.map((c) => {
    const isWhole = c.unit.property.kind === "WHOLE_BUILDING";
    // Q7: WHOLE 顯示「🏪 房產名」；MULTI 顯示「🏢 房產名 房號」
    const unitLabel = isWhole
      ? `🏪 ${c.unit.property.name}`
      : `🏢 ${c.unit.property.name} ${c.unit.number}`;
    return {
      id: c.id,
      propertyId: c.unit.property.id,
      unitLabel,
      unitNumber: c.unit.number,
      tenantName: c.tenant.name,
      tenantPhone: c.tenant.phone,
      startDate: c.startDate.toISOString().slice(0, 10),
      endDate: c.endDate.toISOString().slice(0, 10),
      status: computeContractStatus(c, now),
    };
  });

  return (
    <ContractsClient
      contracts={rows}
      properties={properties}
      canCreate={canCreate}
    />
  );
}
