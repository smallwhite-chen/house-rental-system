import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { TypeCrudClient } from "@/components/ui/TypeCrudClient";
import { createCommunicationTag, updateCommunicationTag, deleteCommunicationTag } from "./actions";

export const metadata: Metadata = {
  title: "溝通標籤管理 ｜ 房屋租賃管理系統",
};

export default async function CommunicationTagsPage() {
  await requirePermission("SETTINGS_COMMUNICATION_TAGS", "VIEW");
  const items = await prisma.communicationTag.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <TypeCrudClient
      moduleName="溝通標籤"
      items={items}
      createAction={createCommunicationTag}
      updateAction={updateCommunicationTag}
      deleteAction={deleteCommunicationTag}
    />
  );
}
