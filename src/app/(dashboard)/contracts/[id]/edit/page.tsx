import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { ContractForm } from "../../contract-form";
import { updateContract, checkContractConflict } from "../../actions";

export const metadata: Metadata = {
  title: "編輯合約 ｜ 房屋租賃管理系統",
};

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("CONTRACTS", "EDIT");
  const { id } = await params;

  const [contract, properties, units, tenants, paymentMethods, bankAccounts, equipmentTypes] =
    await Promise.all([
      prisma.contract.findUnique({
        where: { id },
        include: {
          billingTerms: true,
          equipmentItems: true,
          unit: { include: { property: { select: { name: true } } } },
        },
      }),
      prisma.property.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, kind: true },
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

  if (!contract) notFound();

  const updateForThisContract = updateContract.bind(null, id);

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/contracts" className="hover:text-on-surface hover:underline">合約管理</Link></li>
          <li aria-hidden="true">›</li>
          <li><Link href={`/contracts/${id}`} className="hover:text-on-surface hover:underline">
            {contract.unit.property.name} {contract.unit.number}
          </Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">編輯</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">編輯合約</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          房間與房客不可變更；如需更換，請建立新合約並終止現合約
        </p>
      </header>

      <ContractForm
        mode="edit"
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
        initial={{
          unitId: contract.unitId,
          tenantId: contract.tenantId,
          startDate: contract.startDate.toISOString().slice(0, 10),
          endDate: contract.endDate.toISOString().slice(0, 10),
          signedDate: contract.signedDate.toISOString().slice(0, 10),
          pdfUrl: contract.pdfUrl,
          note: contract.note,
          signatorySameAsTenant: contract.signatorySameAsTenant,
          signatoryName: contract.signatoryName,
          signatoryIdNumber: contract.signatoryIdNumber,
          signatoryPhone: contract.signatoryPhone,
          billing: contract.billingTerms
            ? {
                actualRent: contract.billingTerms.actualRent.toString(),
                rentDueDay: contract.billingTerms.rentDueDay,
                paymentMethodId: contract.billingTerms.paymentMethodId,
                bankAccountId: contract.billingTerms.bankAccountId,
                depositAmount: contract.billingTerms.depositAmount?.toString() ?? null,
                depositReceivedDate:
                  contract.billingTerms.depositReceivedDate?.toISOString().slice(0, 10) ?? null,
                waterUnitPrice: contract.billingTerms.waterUnitPrice?.toString() ?? null,
                electricityUnitPrice: contract.billingTerms.electricityUnitPrice?.toString() ?? null,
                managementFee: contract.billingTerms.managementFee?.toString() ?? null,
              }
            : undefined,
          equipment: contract.equipmentItems.map((e) => ({
            equipmentTypeId: e.equipmentTypeId,
            quantity: e.quantity,
            condition: e.condition,
            note: e.note,
          })),
        }}
        submitLabel="儲存變更"
        onSubmit={updateForThisContract}
        checkConflictAction={checkContractConflict}
        excludeContractId={id}
        nextPath={`/contracts/${id}`}
      />
    </div>
  );
}
