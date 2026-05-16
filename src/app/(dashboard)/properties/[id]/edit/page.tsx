import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PropertyForm } from "../../property-form";
import { updateProperty } from "../../actions";

export const metadata: Metadata = {
  title: "編輯房產 ｜ 房屋租賃管理系統",
};

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("PROPERTIES", "EDIT");
  const { id } = await params;

  const [property, propertyTypes] = await Promise.all([
    prisma.property.findUnique({ where: { id } }),
    prisma.propertyType.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!property) notFound();

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/properties" className="hover:text-on-surface hover:underline">房產管理</Link></li>
          <li aria-hidden="true">›</li>
          <li><Link href={`/properties/${id}`} className="hover:text-on-surface hover:underline">{property.name}</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">編輯</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">編輯房產：{property.name}</h1>
      </header>

      <PropertyForm
        propertyTypes={propertyTypes}
        initial={{
          name: property.name,
          propertyTypeId: property.propertyTypeId,
          city: property.city,
          district: property.district,
          address: property.address,
          buildYear: property.buildYear,
          totalFloors: property.totalFloors,
          note: property.note,
        }}
        submitLabel="儲存變更"
        onSubmit={updateProperty.bind(null, id)}
      />
    </div>
  );
}
