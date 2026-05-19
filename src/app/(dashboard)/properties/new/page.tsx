import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PropertyForm } from "../property-form";
import { createProperty } from "../actions";
import type { PropertyKind } from "@/generated/prisma/client";

export const metadata: Metadata = {
  title: "新增房產 ｜ 房屋租賃管理系統",
};

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  await requirePermission("PROPERTIES", "CREATE");

  // 必須帶 kind 參數（由 PropertyKindModal 設定）；缺值就回列表重選
  const sp = await searchParams;
  const rawKind = sp.kind;
  if (rawKind !== "WHOLE_BUILDING" && rawKind !== "MULTI_UNIT") {
    redirect("/properties");
  }
  const kind = rawKind as PropertyKind;

  // 依房產 kind 過濾種類；未分類的種類（kind=null）不出現
  const propertyTypes = await prisma.propertyType.findMany({
    where: { kind },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/properties" className="hover:text-on-surface hover:underline">房產管理</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">新增房產（{kind === "WHOLE_BUILDING" ? "整棟型" : "多單位型"}）</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">新增房產</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          {kind === "WHOLE_BUILDING"
            ? "整棟出租：建立後直接可簽合約，不需新增房間"
            : "多單位：建立後可在房產內進一步新增房間"}
        </p>
      </header>

      <PropertyForm
        propertyTypes={propertyTypes}
        kind={kind}
        mode="create"
        submitLabel="建立房產"
        onSubmit={createProperty}
      />
    </div>
  );
}
