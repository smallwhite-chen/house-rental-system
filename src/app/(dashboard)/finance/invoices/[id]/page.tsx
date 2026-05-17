import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { StatusChip } from "@/components/ui/StatusChip";
import { INVOICE_STATUS_META } from "@/lib/invoice-status";
import { InvoiceDeleteButton } from "./invoice-delete-button";
import { PaymentRecordList } from "./payment-record-list";
import { deleteInvoice, deletePaymentRecord } from "../actions";

export const metadata: Metadata = {
  title: "帳單詳細 ｜ 房屋租賃管理系統",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePermission("INVOICES", "VIEW");
  const canEdit = hasPermission(ctx, "INVOICES", "EDIT");
  const canDeleteInv = hasPermission(ctx, "INVOICES", "DELETE");
  const canCreatePayment = hasPermission(ctx, "PAYMENTS", "CREATE");
  const canDeletePayment = hasPermission(ctx, "PAYMENTS", "DELETE");

  const { id } = await params;
  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: {
      contract: {
        include: {
          unit: { include: { property: { select: { id: true, name: true } } } },
          tenant: true,
        },
      },
      paymentRecords: {
        orderBy: { paymentDate: "desc" },
        include: { paymentMethod: { select: { name: true } } },
      },
    },
  });
  if (!inv) notFound();
  const unit = inv.contract.unit;
  const tenant = inv.contract.tenant;

  const meta = INVOICE_STATUS_META[inv.status];
  const totalPaid = inv.paymentRecords.reduce((s, p) => s + Number(p.amount), 0);
  const totalDue = Number(inv.totalAmount);
  const remaining = Math.max(0, totalDue - totalPaid);

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/finance/invoices" className="hover:text-on-surface hover:underline">帳單管理</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">
            {unit.property.name} {unit.number} ({fmt(inv.billingPeriodStart)} ~ {fmt(inv.billingPeriodEnd)})
          </li>
        </ol>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-medium text-on-surface">
              {unit.property.name} {unit.number}
            </h1>
            <StatusChip tone={meta.tone} label={meta.label} />
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">
            房客：
            <Link href={`/tenants/${tenant.id}`} className="text-primary hover:underline">
              {tenant.name}
            </Link>
            <span className="mx-2">·</span>
            <Link href={`/contracts/${inv.contract.id}`} className="text-primary hover:underline">
              前往合約
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Link
              href={`/finance/invoices/${inv.id}/edit`}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-secondary-container px-6 text-sm font-medium text-on-secondary-container hover:bg-secondary-container/80"
            >
              編輯度數 / 備註
            </Link>
          )}
          {canCreatePayment && (
            <Link
              href={`/finance/invoices/${inv.id}/payments/new`}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-on-primary shadow-sm hover:bg-primary/90"
            >
              + 新增收款
            </Link>
          )}
          {canDeleteInv && (
            <InvoiceDeleteButton
              invoiceId={inv.id}
              paymentCount={inv.paymentRecords.length}
              status={inv.status}
              deleteAction={deleteInvoice}
            />
          )}
        </div>
      </header>

      {/* ── 基本資料 ── */}
      <section className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="mb-4 text-lg font-medium text-on-surface">基本資料</h2>
        <dl className="grid gap-x-8 gap-y-4 md:grid-cols-3">
          <Field label="帳單期間" value={`${fmt(inv.billingPeriodStart)} ~ ${fmt(inv.billingPeriodEnd)}`} />
          <Field label="應繳日期" value={fmt(inv.dueDate)} />
          <Field label="關聯合約" value={
            <Link href={`/contracts/${inv.contract.id}`} className="text-primary hover:underline">查看合約</Link>
          } />
        </dl>
      </section>

      {/* ── 應收明細 ── */}
      <section className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="mb-4 text-lg font-medium text-on-surface">應收明細</h2>
        <div className="space-y-2 text-sm">
          <Row label="實際租金" value={`NT$ ${money(Number(inv.rentAmount))}`} />
          {inv.managementFee != null && Number(inv.managementFee) > 0 && (
            <Row label="管理費" value={`NT$ ${money(Number(inv.managementFee))}`} />
          )}
          <Row
            label="水費"
            value={
              inv.waterMeterReading != null
                ? `${money(Number(inv.waterMeterReading))} 度 × NT$ ${money(Number(inv.waterUnitPrice ?? 0))} = NT$ ${money(Number(inv.waterAmount ?? 0))}`
                : "—（尚未填入度數）"
            }
          />
          <Row
            label="電費"
            value={
              inv.electricityMeterReading != null
                ? `${money(Number(inv.electricityMeterReading))} 度 × NT$ ${money(Number(inv.electricityUnitPrice ?? 0))} = NT$ ${money(Number(inv.electricityAmount ?? 0))}`
                : "—（尚未填入度數）"
            }
          />
          <div className="my-2 border-t border-outline-variant" />
          <Row label="應收總額" value={<strong className="text-lg text-on-surface">NT$ {money(totalDue)}</strong>} />
          <Row label="累計實收" value={<span className="text-on-surface">NT$ {money(totalPaid)}</span>} />
          {remaining > 0 && (
            <Row label="尚需收款" value={<span className="text-error">NT$ {money(remaining)}</span>} />
          )}
        </div>
        {inv.note && (
          <div className="mt-4 border-t border-outline-variant pt-4">
            <dt className="text-sm text-on-surface-variant">備註</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-on-surface">{inv.note}</dd>
          </div>
        )}
      </section>

      {/* ── 收款紀錄 ── */}
      <section className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="mb-4 text-lg font-medium text-on-surface">
          收款紀錄（{inv.paymentRecords.length} 筆）
        </h2>
        <PaymentRecordList
          invoiceId={inv.id}
          records={inv.paymentRecords.map((p) => ({
            id: p.id,
            paymentDate: fmt(p.paymentDate),
            amount: Number(p.amount),
            method: p.paymentMethod.name,
            note: p.note,
          }))}
          canDelete={canDeletePayment}
          deleteAction={deletePaymentRecord}
        />
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-on-surface-variant">{label}</dt>
      <dd className="mt-1 text-sm text-on-surface">{value ?? <span className="text-outline">—</span>}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-on-surface-variant">{label}</span>
      <span className="text-on-surface">{value}</span>
    </div>
  );
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function money(n: number): string {
  return n.toLocaleString("zh-TW", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
