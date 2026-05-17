import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/rbac";
import { TenantForm } from "../tenant-form";
import { createTenant } from "../actions";

export const metadata: Metadata = {
  title: "新增房客 ｜ 房屋租賃管理系統",
};

export default async function NewTenantPage() {
  await requirePermission("TENANTS", "CREATE");

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/tenants" className="hover:text-on-surface hover:underline">房客管理</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">新增房客</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">新增房客</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          建立房客基本資料，後續可在合約管理中與房間綁定
        </p>
      </header>

      <TenantForm submitLabel="建立房客" onSubmit={createTenant} />
    </div>
  );
}
