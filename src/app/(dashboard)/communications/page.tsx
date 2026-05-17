import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { CommunicationsClient } from "./communications-client";

export const metadata: Metadata = {
  title: "溝通與維修 ｜ 房屋租賃管理系統",
};

export default async function CommunicationsPage() {
  const ctx = await requirePermission("COMMUNICATIONS", "VIEW");
  const canCreate = hasPermission(ctx, "COMMUNICATIONS", "CREATE");

  const [logs, properties, tags] = await Promise.all([
    prisma.communicationLog.findMany({
      orderBy: [{ communicationDate: "desc" }, { createdAt: "desc" }],
      include: {
        unit: {
          select: {
            number: true,
            property: { select: { id: true, name: true } },
          },
        },
        tenant: { select: { name: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
      },
    }),
    prisma.property.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.communicationTag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const rows = logs.map((log) => ({
    id: log.id,
    // 顯示用「YYYY-MM-DD HH:mm」server local time
    communicationDate: formatDateTime(log.communicationDate),
    propertyId: log.unit.property.id,
    propertyName: log.unit.property.name,
    unitId: log.unitId,
    unitNumber: log.unit.number,
    tenantName: log.tenant.name,
    tags: log.tags.map((lt) => ({ id: lt.tag.id, name: lt.tag.name })),
    status: log.status,
    content: log.content,
    attachmentUrl: log.attachmentUrl,
    note: log.note,
  }));

  return (
    <CommunicationsClient
      logs={rows}
      properties={properties}
      tags={tags}
      canCreate={canCreate}
    />
  );
}

function formatDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
