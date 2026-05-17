import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { CommunicationForm } from "../../communication-form";
import { CommunicationDeleteButton } from "./communication-delete-button";
import { updateCommunicationLog, deleteCommunicationLog } from "../../actions";

export const metadata: Metadata = {
  title: "編輯溝通紀錄 ｜ 房屋租賃管理系統",
};

/** 將 Date 轉成 <input type="datetime-local"> 接受的字串「YYYY-MM-DDTHH:mm」。 */
function toDateTimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditCommunicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("COMMUNICATIONS", "EDIT");
  const canDelete = hasPermission(ctx, "COMMUNICATIONS", "DELETE");
  const { id } = await params;

  const now = new Date();
  const [log, properties, units, tenants, tags] = await Promise.all([
    prisma.communicationLog.findUnique({
      where: { id },
      include: {
        tags: { select: { tagId: true } },
        unit: { select: { number: true, property: { select: { name: true } } } },
      },
    }),
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

  if (!log) notFound();

  const updateForThis = updateCommunicationLog.bind(null, id);

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/communications" className="hover:text-on-surface hover:underline">溝通與維修</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">
            {log.unit.property.name} {log.unit.number} · {toDateTimeLocal(log.communicationDate).replace("T", " ")}
          </li>
        </ol>
      </nav>

      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-medium text-on-surface">編輯溝通紀錄</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            可修改關聯資料、內容、標籤、處理狀態
          </p>
        </div>
        {canDelete && (
          <CommunicationDeleteButton logId={id} deleteAction={deleteCommunicationLog} />
        )}
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
        initial={{
          unitId: log.unitId,
          tenantId: log.tenantId,
          // datetime-local 格式：YYYY-MM-DDTHH:mm（使用 server local time）
          communicationDate: toDateTimeLocal(log.communicationDate),
          content: log.content,
          attachmentUrl: log.attachmentUrl,
          status: log.status,
          note: log.note,
          tagIds: log.tags.map((t) => t.tagId),
        }}
        submitLabel="儲存變更"
        onSubmit={updateForThis}
      />
    </div>
  );
}
