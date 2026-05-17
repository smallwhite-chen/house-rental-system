import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { CommunicationForm } from "../communication-form";
import { createCommunicationLog } from "../actions";

export const metadata: Metadata = {
  title: "新增溝通紀錄 ｜ 房屋租賃管理系統",
};

export default async function NewCommunicationPage() {
  await requirePermission("COMMUNICATIONS", "CREATE");

  const now = new Date();
  const [properties, units, tenants, tags] = await Promise.all([
    prisma.property.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.unit.findMany({
      orderBy: [{ propertyId: "asc" }, { number: "asc" }],
      select: {
        id: true,
        number: true,
        propertyId: true,
        contracts: {
          where: {
            startDate: { lte: now },
            endDate: { gte: now },
            manualStatus: { notIn: ["TERMINATED", "COMPLETED"] },
          },
          select: { tenant: { select: { id: true, name: true } } },
          take: 1,
        },
      },
    }),
    prisma.tenant.findMany({ orderBy: { name: "asc" } }),
    prisma.communicationTag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/communications" className="hover:text-on-surface hover:underline">溝通與維修</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">新增紀錄</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">新增溝通紀錄</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          紀錄與房客的維修、租金、合約等各類溝通事項
        </p>
      </header>

      <CommunicationForm
        properties={properties}
        units={units.map((u) => ({
          id: u.id,
          number: u.number,
          propertyId: u.propertyId,
          currentTenantId: u.contracts[0]?.tenant.id ?? null,
          currentTenantName: u.contracts[0]?.tenant.name ?? null,
        }))}
        tenants={tenants.map((t) => ({ id: t.id, name: t.name, phone: t.phone }))}
        tags={tags.map((t) => ({ id: t.id, name: t.name }))}
        submitLabel="建立紀錄"
        onSubmit={createCommunicationLog}
      />
    </div>
  );
}
