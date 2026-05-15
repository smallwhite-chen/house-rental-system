"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

const PATH = "/settings/payment-methods";
const MODULE = "SETTINGS_PAYMENT_METHODS" as const;

// ─── Bank Accounts ──────────────────────────────────────────────────────────

export async function createBankAccount(fd: FormData) {
  const ctx = await requirePermission(MODULE, "CREATE");
  const bankName = (fd.get("bankName") as string)?.trim();
  const branchName = (fd.get("branchName") as string)?.trim();
  const accountNumber = (fd.get("accountNumber") as string)?.trim();
  const accountHolder = (fd.get("accountHolder") as string)?.trim();
  const note = (fd.get("note") as string)?.trim() || null;

  if (!bankName || !branchName || !accountNumber || !accountHolder) {
    return { error: "銀行名稱、分行名稱、帳號、戶名均為必填" };
  }
  try {
    const item = await prisma.bankAccount.create({ data: { bankName, branchName, accountNumber, accountHolder, note } });
    await logAudit({ userId: ctx.id, module: MODULE, action: "CREATE", targetType: "BankAccount", targetId: item.id, changes: { after: { bankName, branchName, accountNumber, accountHolder } } });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "建立失敗，請稍後再試" };
  }
}

export async function updateBankAccount(id: string, fd: FormData) {
  const ctx = await requirePermission(MODULE, "EDIT");
  const bankName = (fd.get("bankName") as string)?.trim();
  const branchName = (fd.get("branchName") as string)?.trim();
  const accountNumber = (fd.get("accountNumber") as string)?.trim();
  const accountHolder = (fd.get("accountHolder") as string)?.trim();
  const note = (fd.get("note") as string)?.trim() || null;

  if (!bankName || !branchName || !accountNumber || !accountHolder) {
    return { error: "銀行名稱、分行名稱、帳號、戶名均為必填" };
  }
  try {
    const before = await prisma.bankAccount.findUnique({ where: { id }, select: { bankName: true, branchName: true, accountNumber: true, accountHolder: true } });
    await prisma.bankAccount.update({ where: { id }, data: { bankName, branchName, accountNumber, accountHolder, note } });
    await logAudit({ userId: ctx.id, module: MODULE, action: "UPDATE", targetType: "BankAccount", targetId: id, changes: { before, after: { bankName, branchName, accountNumber, accountHolder } } });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "更新失敗，請稍後再試" };
  }
}

export async function deleteBankAccount(id: string) {
  const ctx = await requirePermission(MODULE, "DELETE");
  try {
    const item = await prisma.bankAccount.findUnique({ where: { id }, select: { bankName: true, accountNumber: true } });
    await prisma.bankAccount.delete({ where: { id } });
    await logAudit({ userId: ctx.id, module: MODULE, action: "DELETE", targetType: "BankAccount", targetId: id, changes: { before: item } });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "此銀行帳號正在被合約使用中，無法刪除" };
  }
}

// ─── Payment Method Categories ───────────────────────────────────────────────

export async function createPaymentCategory(fd: FormData) {
  const ctx = await requirePermission(MODULE, "CREATE");
  const name = (fd.get("name") as string)?.trim();
  const note = (fd.get("note") as string)?.trim() || null;
  if (!name) return { error: "種類名稱為必填" };
  try {
    const item = await prisma.paymentMethodCategory.create({ data: { name, note } });
    await logAudit({ userId: ctx.id, module: MODULE, action: "CREATE", targetType: "PaymentMethodCategory", targetId: item.id, changes: { after: { name } } });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "此種類名稱已存在，請使用不同名稱" };
  }
}

export async function updatePaymentCategory(id: string, fd: FormData) {
  const ctx = await requirePermission(MODULE, "EDIT");
  const name = (fd.get("name") as string)?.trim();
  const note = (fd.get("note") as string)?.trim() || null;
  if (!name) return { error: "種類名稱為必填" };
  try {
    const before = await prisma.paymentMethodCategory.findUnique({ where: { id }, select: { name: true } });
    await prisma.paymentMethodCategory.update({ where: { id }, data: { name, note } });
    await logAudit({ userId: ctx.id, module: MODULE, action: "UPDATE", targetType: "PaymentMethodCategory", targetId: id, changes: { before, after: { name } } });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "此種類名稱已存在，請使用不同名稱" };
  }
}

export async function deletePaymentCategory(id: string) {
  const ctx = await requirePermission(MODULE, "DELETE");
  try {
    const item = await prisma.paymentMethodCategory.findUnique({ where: { id }, select: { name: true } });
    await prisma.paymentMethodCategory.delete({ where: { id } });
    await logAudit({ userId: ctx.id, module: MODULE, action: "DELETE", targetType: "PaymentMethodCategory", targetId: id, changes: { before: item } });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "此收款方式正在被合約或收款紀錄使用中，無法刪除" };
  }
}
