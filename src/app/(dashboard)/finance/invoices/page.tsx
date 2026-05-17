import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { InvoicesClient } from "./invoices-client";

export const metadata: Metadata = {
  title: "帳單管理 ｜ 房屋租賃管理系統",
};

export default async function InvoicesPage() {
  await requirePermission("INVOICES", "VIEW");

  const [invoices, properties] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: [{ dueDate: "desc" }],
      include: {
        contract: {
          include: {
            unit: {
              select: {
                number: true,
                property: { select: { id: true, name: true } },
              },
            },
            tenant: { select: { name: true } },
          },
        },
        paymentRecords: { select: { amount: true } },
      },
    }),
    prisma.property.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const rows = invoices.map((inv) => {
    const totalPaid = inv.paymentRecords.reduce((s, p) => s + Number(p.amount), 0);
    return {
      id: inv.id,
      propertyId: inv.contract.unit.property.id,
      propertyName: inv.contract.unit.property.name,
      unitNumber: inv.contract.unit.number,
      tenantName: inv.contract.tenant.name,
      periodStart: inv.billingPeriodStart.toISOString().slice(0, 10),
      periodEnd: inv.billingPeriodEnd.toISOString().slice(0, 10),
      dueDate: inv.dueDate.toISOString().slice(0, 10),
      totalAmount: Number(inv.totalAmount),
      totalPaid,
      status: inv.status,
    };
  });

  return <InvoicesClient invoices={rows} properties={properties} />;
}
