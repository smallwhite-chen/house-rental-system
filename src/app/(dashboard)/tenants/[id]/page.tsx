import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { StatusChip } from "@/components/ui/StatusChip";
import {
  computeTenantStatus,
  TENANT_STATUS_META,
} from "@/lib/tenant-status";
import { TenantDeleteButton } from "./tenant-delete-button";
import { deleteTenant } from "../actions";

export const metadata: Metadata = {
  title: "房客詳細 ｜ 房屋租賃管理系統",
};

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("TENANTS", "VIEW");
  const canEdit = hasPermission(ctx, "TENANTS", "EDIT");
  const canDelete = hasPermission(ctx, "TENANTS", "DELETE");

  const { id } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      contracts: {
        orderBy: { signedDate: "desc" },
        include: {
          unit: {
            select: {
              number: true,
              property: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  if (!tenant) notFound();

  const status = computeTenantStatus(tenant.contracts);
  const meta = TENANT_STATUS_META[status];

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/tenants" className="hover:text-on-surface hover:underline">房客管理</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">{tenant.name}</li>
        </ol>
      </nav>

      <header className="flex items-end justify-between">
        <div className="flex items-center gap-4">
          {tenant.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.photoUrl}
              alt={`${tenant.name} 的個人照`}
              className="h-14 w-14 rounded-full object-cover ring-1 ring-outline-variant"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <UserIcon />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-medium text-on-surface">{tenant.name}</h1>
              <StatusChip tone={meta.tone} label={meta.label} />
            </div>
            <p className="mt-1 text-sm text-on-surface-variant">
              身分證字號：<span className="font-mono">{tenant.idNumber}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Link
              href={`/tenants/${tenant.id}/edit`}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-secondary-container px-6 text-sm font-medium text-on-secondary-container hover:bg-secondary-container/80"
            >
              編輯
            </Link>
          )}
          {canDelete && (
            <TenantDeleteButton
              tenantId={tenant.id}
              tenantName={tenant.name}
              contractCount={tenant.contracts.length}
              deleteAction={deleteTenant}
            />
          )}
        </div>
      </header>

      {/* 基本資料 */}
      <section className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="mb-4 text-lg font-medium text-on-surface">基本資料</h2>
        <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          <Field label="聯絡電話" value={tenant.phone} />
          <Field label="Email" value={tenant.email} />
          <Field label="緊急聯絡人姓名" value={tenant.emergencyContactName} />
          <Field label="緊急聯絡人電話" value={tenant.emergencyContactPhone} />
          {tenant.note && (
            <div className="md:col-span-2">
              <dt className="text-sm text-on-surface-variant">備註</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-on-surface">{tenant.note}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* 合約歷史 */}
      <section className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="mb-4 text-lg font-medium text-on-surface">
          合約歷史（{tenant.contracts.length} 份）
        </h2>
        {tenant.contracts.length === 0 ? (
          <div className="py-10 text-center text-sm text-on-surface-variant">
            尚無合約紀錄。合約管理模組（Phase 5）上線後，將自動顯示此房客的所有合約。
          </div>
        ) : (
          <ol className="space-y-3">
            {tenant.contracts.map((c) => (
              <li key={c.id} className="rounded-xl bg-surface-container p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-on-surface">
                      {c.unit.property?.name} {c.unit.number}
                    </p>
                    <p className="text-xs text-on-surface-variant font-mono">
                      {fmt(c.startDate)} ~ {fmt(c.endDate)}
                    </p>
                  </div>
                  {c.manualStatus && (
                    <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs text-on-surface-variant">
                      {c.manualStatus === "TERMINATED" ? "已終止" : c.manualStatus === "COMPLETED" ? "已完成" : c.manualStatus}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-sm text-on-surface-variant">{label}</dt>
      <dd className="mt-1 text-sm text-on-surface">
        {value ?? <span className="text-outline">—</span>}
      </dd>
    </div>
  );
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7" aria-hidden="true">
      <path fillRule="evenodd" d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-7 9a7 7 0 1 1 14 0H3Z" clipRule="evenodd" />
    </svg>
  );
}
