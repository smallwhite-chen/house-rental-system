import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PaymentForm } from "./payment-form";
import { createPaymentRecord } from "../../../actions";

export const metadata: Metadata = {
  title: "新增收款 ｜ 房屋租賃管理系統",
};

export default async function NewPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("PAYMENTS", "CREATE");
  const { id } = await params;

  const [inv, paymentMethods] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            unit: { include: { property: { select: { name: true } } } },
            tenant: { select: { name: true } },
          },
        },
        paymentRecords: { select: { amount: true } },
      },
    }),
    prisma.paymentMethodCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!inv) notFound();
  const unit = inv.contract.unit;
  const tenant = inv.contract.tenant;

  const totalPaid = inv.paymentRecords.reduce((s, p) => s + Number(p.amount), 0);
  const totalDue = Number(inv.totalAmount);
  const remaining = Math.max(0, totalDue - totalPaid);
  const defaultAmount = remaining > 0 ? remaining : totalDue;

  const action = createPaymentRecord.bind(null, id);

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
          <li className="text-on-surface">新增收款</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">新增收款</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          {unit.property.name} {unit.number} · {tenant.name} · 應收 NT$ {money(totalDue)} · 已收 NT$ {money(totalPaid)}
        </p>
      </header>

      <PaymentForm
        invoiceId={id}
        defaultAmount={defaultAmount}
        paymentMethods={paymentMethods.map((p) => ({ id: p.id, name: p.name }))}
        onSubmit={action}
      />
    </div>
  );
}

function money(n: number): string {
  return n.toLocaleString("zh-TW", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
