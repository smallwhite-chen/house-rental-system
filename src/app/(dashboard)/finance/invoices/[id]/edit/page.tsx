import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { InvoiceEditForm } from "./invoice-edit-form";
import { updateInvoice } from "../../actions";

export const metadata: Metadata = {
  title: "編輯帳單 ｜ 房屋租賃管理系統",
};

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("INVOICES", "EDIT");
  const { id } = await params;

  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: {
      contract: {
        include: {
          unit: { include: { property: { select: { name: true } } } },
          billingTerms: true,
        },
      },
    },
  });
  if (!inv) notFound();
  const unit = inv.contract.unit;
  const terms = inv.contract.billingTerms;

  const action = updateInvoice.bind(null, id);

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/finance/invoices" className="hover:text-on-surface hover:underline">帳單管理</Link></li>
          <li aria-hidden="true">›</li>
          <li><Link href={`/finance/invoices/${id}`} className="hover:text-on-surface hover:underline">
            {unit.property.name} {unit.number}
          </Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">編輯</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">編輯帳單</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          僅可修改水費／電費度數與備註；租金與管理費為合約 snapshot 不可修改
        </p>
      </header>

      <InvoiceEditForm
        invoiceId={id}
        initial={{
          waterMeterReading: inv.waterMeterReading?.toString() ?? "",
          // 優先採合約「最新」單價（儲存時會自動同步到帳單 snapshot）
          waterUnitPrice: terms?.waterUnitPrice
            ? Number(terms.waterUnitPrice)
            : inv.waterUnitPrice
            ? Number(inv.waterUnitPrice)
            : 0,
          electricityMeterReading: inv.electricityMeterReading?.toString() ?? "",
          electricityUnitPrice: terms?.electricityUnitPrice
            ? Number(terms.electricityUnitPrice)
            : inv.electricityUnitPrice
            ? Number(inv.electricityUnitPrice)
            : 0,
          // 帳單 snapshot vs 合約現值，用於提示是否同步
          invoiceWaterUnitPrice: inv.waterUnitPrice ? Number(inv.waterUnitPrice) : null,
          contractWaterUnitPrice: terms?.waterUnitPrice ? Number(terms.waterUnitPrice) : null,
          invoiceElectricityUnitPrice: inv.electricityUnitPrice ? Number(inv.electricityUnitPrice) : null,
          contractElectricityUnitPrice: terms?.electricityUnitPrice ? Number(terms.electricityUnitPrice) : null,
          rentAmount: Number(inv.rentAmount),
          // 管理費：計算使用合約現值；同時保留帳單 snapshot 供比對
          managementFee: terms?.managementFee
            ? Number(terms.managementFee)
            : inv.managementFee
            ? Number(inv.managementFee)
            : 0,
          invoiceManagementFee: inv.managementFee ? Number(inv.managementFee) : null,
          contractManagementFee: terms?.managementFee ? Number(terms.managementFee) : null,
          note: inv.note ?? "",
        }}
        onSubmit={action}
      />
    </div>
  );
}
