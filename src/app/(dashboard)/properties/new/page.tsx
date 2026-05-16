import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PropertyForm } from "../property-form";
import { createProperty } from "../actions";

export const metadata: Metadata = {
  title: "新增房產 ｜ 房屋租賃管理系統",
};

export default async function NewPropertyPage() {
  await requirePermission("PROPERTIES", "CREATE");
  const propertyTypes = await prisma.propertyType.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/properties" className="hover:text-on-surface hover:underline">房產管理</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">新增房產</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">新增房產</h1>
        <p className="mt-1 text-sm text-on-surface-variant">建立後可以在房產內進一步新增房間</p>
      </header>

      <PropertyForm propertyTypes={propertyTypes} submitLabel="建立房產" onSubmit={createProperty} />
    </div>
  );
}
