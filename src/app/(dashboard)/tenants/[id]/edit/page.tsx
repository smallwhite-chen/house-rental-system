import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { TenantForm } from "../../tenant-form";
import { updateTenant } from "../../actions";

export const metadata: Metadata = {
  title: "編輯房客 ｜ 房屋租賃管理系統",
};

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("TENANTS", "EDIT");
  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) notFound();

  // 將 server action bind id（避開 client→server 函式序列化限制）
  const updateForThisTenant = updateTenant.bind(null, id);

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/tenants" className="hover:text-on-surface hover:underline">房客管理</Link></li>
          <li aria-hidden="true">›</li>
          <li><Link href={`/tenants/${tenant.id}`} className="hover:text-on-surface hover:underline">{tenant.name}</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">編輯</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">編輯房客：{tenant.name}</h1>
        <p className="mt-1 text-sm text-on-surface-variant">修改房客基本資料與緊急聯絡人資訊</p>
      </header>

      <TenantForm
        initial={{
          name: tenant.name,
          idNumber: tenant.idNumber,
          phone: tenant.phone,
          email: tenant.email,
          emergencyContactName: tenant.emergencyContactName,
          emergencyContactPhone: tenant.emergencyContactPhone,
          note: tenant.note,
        }}
        submitLabel="儲存變更"
        onSubmit={updateForThisTenant}
        nextPath={`/tenants/${id}`}
      />
    </div>
  );
}
