import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PropertyTypesClient } from "./property-types-client";
import { createPropertyType, updatePropertyType, deletePropertyType } from "./actions";

export const metadata: Metadata = {
  title: "房產種類管理 ｜ 房屋租賃管理系統",
};

export default async function PropertyTypesPage() {
  await requirePermission("SETTINGS_PROPERTY_TYPES", "VIEW");

  const items = await prisma.propertyType.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { properties: true } } },
  });

  return (
    <PropertyTypesClient
      items={items.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        kind: t.kind,
        inUse: t._count.properties > 0,
        createdAt: t.createdAt,
      }))}
      createAction={createPropertyType}
      updateAction={updatePropertyType}
      deleteAction={deletePropertyType}
    />
  );
}
