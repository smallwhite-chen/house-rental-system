import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { TypeCrudClient } from "@/components/ui/TypeCrudClient";
import { createEquipmentType, updateEquipmentType, deleteEquipmentType } from "./actions";

export const metadata: Metadata = {
  title: "設備種類管理 ｜ 房屋租賃管理系統",
};

export default async function EquipmentTypesPage() {
  await requirePermission("SETTINGS_EQUIPMENT_TYPES", "VIEW");
  const items = await prisma.equipmentType.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <TypeCrudClient
      moduleName="設備種類"
      items={items}
      createAction={createEquipmentType}
      updateAction={updateEquipmentType}
      deleteAction={deleteEquipmentType}
    />
  );
}
