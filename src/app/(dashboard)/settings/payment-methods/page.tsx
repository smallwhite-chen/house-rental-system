import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PaymentMethodsClient } from "./client";
import {
  createBankAccount, updateBankAccount, deleteBankAccount,
  createPaymentCategory, updatePaymentCategory, deletePaymentCategory,
} from "./actions";

export const metadata: Metadata = {
  title: "收款方式管理 ｜ 房屋租賃管理系統",
};

export default async function PaymentMethodsPage() {
  await requirePermission("SETTINGS_PAYMENT_METHODS", "VIEW");

  const [bankAccounts, paymentCategories] = await Promise.all([
    prisma.bankAccount.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.paymentMethodCategory.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2 text-on-surface-variant">
          <li><Link href="/settings" className="hover:text-on-surface hover:underline">系統設定</Link></li>
          <li aria-hidden="true">›</li>
          <li className="text-on-surface">收款方式管理</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-3xl font-medium text-on-surface">收款方式管理</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          管理公司銀行帳號與收款方式種類（現金、匯款等）
        </p>
      </header>

      <PaymentMethodsClient
        bankAccounts={bankAccounts}
        paymentCategories={paymentCategories}
        createBankAccount={createBankAccount}
        updateBankAccount={updateBankAccount}
        deleteBankAccount={deleteBankAccount}
        createPaymentCategory={createPaymentCategory}
        updatePaymentCategory={updatePaymentCategory}
        deletePaymentCategory={deletePaymentCategory}
      />
    </div>
  );
}
