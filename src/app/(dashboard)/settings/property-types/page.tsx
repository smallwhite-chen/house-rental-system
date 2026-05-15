import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { TypeCrudClient } from "@/components/ui/TypeCrudClient";
import { createPropertyType, updatePropertyType, deletePropertyType } from "./actions";

export const metadata: Metadata = {
  title: "房產種類管理 ｜ 房屋租賃管理系統",
};

export default async function PropertyTypesPage() {
  await requirePermission("SETTINGS_PROPERTY_TYPES", "VIEW");
  const items = await prisma.propertyType.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <TypeCrudClient
      moduleName="房產種類"
      items={items}
      createAction={createPropertyType}
      updateAction={updatePropertyType}
      deleteAction={deletePropertyType}
    />
  );
}
