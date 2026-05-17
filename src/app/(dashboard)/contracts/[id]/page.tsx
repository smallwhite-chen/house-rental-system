import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { StatusChip } from "@/components/ui/StatusChip";
import { computeContractStatus, CONTRACT_STATUS_META } from "@/lib/contract-status";
import { ContractActionButtons } from "./contract-actions";
import { terminateContract, completeContract, deleteContract } from "../actions";
import type { EquipmentCondition } from "@/generated/prisma/client";

export const metadata: Metadata = {
  title: "合約詳細 ｜ 房屋租賃管理系統",
};

const COND_LABEL: Record<EquipmentCondition, string> = {
  GOOD: "良好",
  FAIR: "普通",
  DAMAGED: "損壞",
};

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("CONTRACTS", "VIEW");
  const canEdit = hasPermission(ctx, "CONTRACTS", "EDIT");
  const canDelete = hasPermission(ctx, "CONTRACTS", "DELETE");

  const { id } = await params;
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      unit: { include: { property: { select: { id: true, name: true } } } },
      tenant: true,
      billingTerms: {
        include: {
          paymentMethod: { select: { name: true } },
          bankAccount: true,
        },
      },
      equipmentItems: { include: { equipmentType: { select: { name: true } } } },
      _count: { select: { invoices: true } },
    },
  });
  if (!contract) notFound();

  const status = computeContractStatus(contract);
  const meta = CONTRACT_STATUS_META[status];

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/contracts" className="hover:text-on-surface hover:underline">合約管理</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">
            {contract.unit.property.name} {contract.unit.number} × {contract.tenant.name}
          </li>
        </ol>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-medium text-on-surface">
              {contract.unit.property.name} {contract.unit.number}
            </h1>
            <StatusChip tone={meta.tone} label={meta.label} />
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">
            房客：
            <Link href={`/tenants/${contract.tenant.id}`} className="text-primary hover:underline">
              {contract.tenant.name}
            </Link>
            <span className="mx-2">·</span>
            <Link
              href={`/properties/${contract.unit.property.id}/units/${contract.unit.id}`}
              className="text-primary hover:underline"
            >
              前往房間頁
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && status !== "TERMINATED" && status !== "COMPLETED" && (
            <Link
              href={`/contracts/${contract.id}/edit`}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-secondary-container px-6 text-sm font-medium text-on-secondary-container hover:bg-secondary-container/80"
            >
              編輯
            </Link>
          )}
          <ContractActionButtons
            contractId={contract.id}
            currentStatus={status}
            canEdit={canEdit}
            canDelete={canDelete}
            invoiceCount={contract._count.invoices}
            terminateAction={terminateContract}
            completeAction={completeContract}
            deleteAction={deleteContract}
          />
        </div>
      </header>

      {/* ── 基本資料 ── */}
      <section className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="mb-4 text-lg font-medium text-on-surface">基本資料</h2>
        <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          <Field label="合約開始日" value={fmt(contract.startDate)} />
          <Field label="合約結束日" value={fmt(contract.endDate)} />
          <Field label="簽約日期" value={fmt(contract.signedDate)} />
          <Field
            label="合約 PDF"
            value={
              <a
                href={contract.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                開啟 PDF
              </a>
            }
          />
          {contract.note && (
            <div className="md:col-span-2">
              <dt className="text-sm text-on-surface-variant">備註</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-on-surface">{contract.note}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* ── 簽約人資料 ── */}
      <section className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-medium text-on-surface">簽約人資料</h2>
          {contract.signatorySameAsTenant && (
            <span className="rounded-full bg-primary-container px-2 py-0.5 text-xs text-on-primary-container">
              同房客資料
            </span>
          )}
        </div>
        <dl className="grid gap-x-8 gap-y-4 md:grid-cols-3">
          <Field label="姓名" value={contract.signatoryName} />
          <Field label="身分證字號" value={<span className="font-mono">{contract.signatoryIdNumber}</span>} />
          <Field label="聯絡電話" value={contract.signatoryPhone} />
        </dl>
      </section>

      {/* ── 租金條件 ── */}
      <section className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="mb-4 text-lg font-medium text-on-surface">租金條件</h2>
        {contract.billingTerms ? (
          <dl className="grid gap-x-8 gap-y-4 md:grid-cols-3">
            <Field label="實際租金" value={`NT$ ${contract.billingTerms.actualRent.toString()}`} />
            <Field label="收租日" value={`每月 ${contract.billingTerms.rentDueDay} 號`} />
            <Field label="收款方式" value={contract.billingTerms.paymentMethod.name} />
            {contract.billingTerms.bankAccount && (
              <Field
                label="收款銀行帳號"
                value={`${contract.billingTerms.bankAccount.bankName} ${contract.billingTerms.bankAccount.accountNumber}`}
              />
            )}
            {contract.billingTerms.depositAmount && (
              <Field label="押金" value={`NT$ ${contract.billingTerms.depositAmount.toString()}`} />
            )}
            {contract.billingTerms.depositReceivedDate && (
              <Field label="押金收款日" value={fmt(contract.billingTerms.depositReceivedDate)} />
            )}
            {contract.billingTerms.waterUnitPrice && (
              <Field label="水費單價" value={`NT$ ${contract.billingTerms.waterUnitPrice.toString()} / 度`} />
            )}
            {contract.billingTerms.electricityUnitPrice && (
              <Field label="電費單價" value={`NT$ ${contract.billingTerms.electricityUnitPrice.toString()} / 度`} />
            )}
            {contract.billingTerms.managementFee && (
              <Field label="管理費" value={`NT$ ${contract.billingTerms.managementFee.toString()} / 月`} />
            )}
          </dl>
        ) : (
          <p className="text-sm text-on-surface-variant">尚未設定租金條件</p>
        )}
      </section>

      {/* ── 設備清單 ── */}
      <section className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="mb-4 text-lg font-medium text-on-surface">
          設備清單（{contract.equipmentItems.length} 項）
        </h2>
        {contract.equipmentItems.length === 0 ? (
          <p className="py-4 text-center text-sm text-on-surface-variant">尚未登錄任何設備</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-on-surface-variant">
              <tr>
                <th className="pb-2">設備</th>
                <th className="pb-2">數量</th>
                <th className="pb-2">狀態</th>
                <th className="pb-2">備註</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {contract.equipmentItems.map((e) => (
                <tr key={e.id}>
                  <td className="py-2 font-medium text-on-surface">{e.equipmentType.name}</td>
                  <td className="py-2 text-on-surface-variant">{e.quantity}</td>
                  <td className="py-2 text-on-surface-variant">{COND_LABEL[e.condition]}</td>
                  <td className="py-2 text-on-surface-variant">
                    {e.note ?? <span className="text-outline">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
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
