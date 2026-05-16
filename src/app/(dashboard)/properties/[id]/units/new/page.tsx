import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { UnitForm } from "../unit-form";
import { createUnit } from "../actions";

export const metadata: Metadata = {
  title: "新增房間 ｜ 房屋租賃管理系統",
};

export default async function NewUnitPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("PROPERTIES", "CREATE");
  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    select: { name: true, totalFloors: true },
  });
  if (!property) notFound();

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/properties" className="hover:text-on-surface hover:underline">房產管理</Link></li>
          <li aria-hidden="true">›</li>
          <li><Link href={`/properties/${id}`} className="hover:text-on-surface hover:underline">{property.name}</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">新增房間</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">新增房間</h1>
        <p className="mt-1 text-sm text-on-surface-variant">所屬房產：{property.name}</p>
      </header>

      <UnitForm
        propertyId={id}
        totalFloors={property.totalFloors}
        submitLabel="建立房間"
        allowManualStatus={false}
        onSubmit={createUnit.bind(null, id)}
      />
    </div>
  );
}
