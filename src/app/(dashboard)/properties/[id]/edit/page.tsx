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

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) notFound();

  // 依當前房產 kind 過濾種類下拉；包含目前已選的 kind 為 null 的種類（防止編輯時看不到自己原本的種類）
  const propertyTypes = await prisma.propertyType.findMany({
    where: {
      OR: [
        { kind: property.kind },
        { id: property.propertyTypeId }, // 保留目前已選的種類，即使 kind 不符
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  // WHOLE_BUILDING：抓出隱形 Unit 的 baseRent 帶入表單
  let baseRent: string | null = null;
  if (property.kind === "WHOLE_BUILDING") {
    const unit = await prisma.unit.findFirst({
      where: { propertyId: id },
      select: { baseRent: true },
    });
    baseRent = unit ? unit.baseRent.toString() : null;
  }

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
        kind={property.kind}
        mode="edit"
        initial={{
          kind: property.kind,
          name: property.name,
          propertyTypeId: property.propertyTypeId,
          city: property.city,
          district: property.district,
          address: property.address,
          buildYear: property.buildYear,
          totalFloors: property.totalFloors,
          baseRent,
          images: property.images,
          note: property.note,
        }}
        submitLabel="儲存變更"
        onSubmit={updateProperty.bind(null, id)}
      />
    </div>
  );
}
