import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { ContractForm } from "../contract-form";
import { createContract, checkContractConflict } from "../actions";

export const metadata: Metadata = {
  title: "新增合約 ｜ 房屋租賃管理系統",
};

export default async function NewContractPage() {
  await requirePermission("CONTRACTS", "CREATE");

  const [properties, units, tenants, paymentMethods, bankAccounts, equipmentTypes] =
    await Promise.all([
      prisma.property.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.unit.findMany({
        orderBy: [{ property: { name: "asc" } }, { number: "asc" }],
        include: { property: { select: { id: true, name: true } } },
      }),
      prisma.tenant.findMany({ orderBy: { name: "asc" } }),
      prisma.paymentMethodCategory.findMany({ orderBy: { name: "asc" } }),
      prisma.bankAccount.findMany({ orderBy: { bankName: "asc" } }),
      prisma.equipmentType.findMany({ orderBy: { name: "asc" } }),
    ]);

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/contracts" className="hover:text-on-surface hover:underline">合約管理</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">新增合約</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">新增合約</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          請依序填寫基本資料、簽約人、租金條件與設備清單
        </p>
      </header>

      <ContractForm
        mode="create"
        properties={properties}
        units={units.map((u) => ({
          id: u.id,
          number: u.number,
          propertyId: u.property.id,
          propertyName: u.property.name,
          baseRent: u.baseRent.toString(),
        }))}
        tenants={tenants.map((t) => ({
          id: t.id,
          name: t.name,
          idNumber: t.idNumber,
          phone: t.phone,
        }))}
        paymentMethods={paymentMethods.map((p) => ({ id: p.id, name: p.name }))}
        bankAccounts={bankAccounts.map((b) => ({
          id: b.id,
          label: `${b.bankName} ${b.branchName} ${b.accountNumber}（${b.accountHolder}）`,
        }))}
        equipmentTypes={equipmentTypes.map((e) => ({ id: e.id, name: e.name }))}
        submitLabel="建立合約"
        onSubmit={createContract}
        checkConflictAction={checkContractConflict}
      />
    </div>
  );
}
