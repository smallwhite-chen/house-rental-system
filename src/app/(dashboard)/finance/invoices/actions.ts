"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import {
  computeInvoiceAmounts,
  computeInvoiceStatus,
  computeNextBillingPeriod,
} from "@/lib/invoice-status";

// ─── 共用：依現有 PaymentRecord 重算帳單狀態與金額 ──────────────────────────

/**
 * 重新計算指定帳單的狀態與金額。
 * 任何「會影響帳單金額或實收」的操作（更新度數、增刪收款）都要呼叫。
 */
async function recomputeInvoice(
  tx: typeof prisma | Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  invoiceId: string
) {
  const inv = await tx.invoice.findUnique({
    where: { id: invoiceId },
    include: { paymentRecords: { select: { amount: true } } },
  });
  if (!inv) return;

  const amounts = computeInvoiceAmounts({
    rentAmount: Number(inv.rentAmount),
    managementFee: Number(inv.managementFee ?? 0),
    waterUnitPrice: Number(inv.waterUnitPrice ?? 0),
    electricityUnitPrice: Number(inv.electricityUnitPrice ?? 0),
    waterMeterReading:
      inv.waterMeterReading != null ? Number(inv.waterMeterReading) : null,
    electricityMeterReading:
      inv.electricityMeterReading != null ? Number(inv.electricityMeterReading) : null,
  });

  const totalPaid = inv.paymentRecords.reduce((s, p) => s + Number(p.amount), 0);
  const status = computeInvoiceStatus(amounts.totalAmount, totalPaid, inv.dueDate);

  await tx.invoice.update({
    where: { id: invoiceId },
    data: {
      waterAmount: amounts.waterAmount,
      electricityAmount: amounts.electricityAmount,
      totalAmount: amounts.totalAmount,
      status,
    },
  });
}

// ─── 從合約手動產生本期帳單 ──────────────────────────────────────────────────

export async function createInvoiceFromContract(contractId: string) {
  const ctx = await requirePermission("INVOICES", "CREATE");

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { billingTerms: true },
  });
  if (!contract) return { error: "合約不存在" };
  if (!contract.billingTerms) return { error: "此合約尚未設定租金條件，無法產生帳單" };
  if (contract.manualStatus === "TERMINATED" || contract.manualStatus === "COMPLETED") {
    return { error: "已終止或已完成的合約不可產生新帳單" };
  }

  const terms = contract.billingTerms;
  const { billingPeriodStart, billingPeriodEnd, dueDate } = computeNextBillingPeriod(
    terms.rentDueDay
  );

  // 同合約同期間禁止重複產生
  const exists = await prisma.invoice.findFirst({
    where: { contractId, billingPeriodStart },
    select: { id: true },
  });
  if (exists) {
    return {
      error: `此合約本期帳單（${fmt(billingPeriodStart)} ~ ${fmt(billingPeriodEnd)}）已存在，請至「帳單管理」查看`,
      duplicateId: exists.id,
    };
  }

  // 帳單初始金額（未填度數，水電金額為 0）
  const rentAmount = Number(terms.actualRent);
  const managementFee = Number(terms.managementFee ?? 0);
  const totalAmount = rentAmount + managementFee;

  try {
    const created = await prisma.invoice.create({
      data: {
        contractId,
        unitId: contract.unitId,
        tenantId: contract.tenantId,
        billingPeriodStart,
        billingPeriodEnd,
        dueDate,
        rentAmount,
        managementFee: terms.managementFee,
        waterUnitPrice: terms.waterUnitPrice,
        electricityUnitPrice: terms.electricityUnitPrice,
        totalAmount,
        status: "UNPAID",
      },
    });

    await logAudit({
      userId: ctx.id,
      module: "INVOICES",
      action: "CREATE",
      targetType: "Invoice",
      targetId: created.id,
      changes: { after: { contractId, billingPeriodStart, totalAmount } },
    });

    revalidatePath("/finance/invoices");
    revalidatePath(`/contracts/${contractId}`);
    return { ok: true as const, id: created.id };
  } catch (e) {
    console.error("[invoice:create]", e);
    return { error: "建立帳單失敗，請稍後再試" };
  }
}

// ─── 更新帳單度數 / 備註 ─────────────────────────────────────────────────────

export async function updateInvoice(id: string, fd: FormData) {
  const ctx = await requirePermission("INVOICES", "EDIT");

  const waterStr = (fd.get("waterMeterReading") as string)?.trim();
  const elecStr = (fd.get("electricityMeterReading") as string)?.trim();
  const note = ((fd.get("note") as string) ?? "").trim() || null;

  const waterMeterReading = waterStr === "" ? null : Number(waterStr);
  const electricityMeterReading = elecStr === "" ? null : Number(elecStr);

  if (waterMeterReading != null && !(waterMeterReading >= 0)) {
    return { error: "水費度數必須為 0 或正數" };
  }
  if (electricityMeterReading != null && !(electricityMeterReading >= 0)) {
    return { error: "電費度數必須為 0 或正數" };
  }

  // 取合約最新單價 / 管理費，儲存時一併同步到帳單 snapshot
  const inv = await prisma.invoice.findUnique({
    where: { id },
    select: { contract: { select: { billingTerms: true } } },
  });
  const latestWaterUnit = inv?.contract.billingTerms?.waterUnitPrice ?? null;
  const latestElecUnit = inv?.contract.billingTerms?.electricityUnitPrice ?? null;
  const latestMgmtFee = inv?.contract.billingTerms?.managementFee ?? null;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id },
        data: {
          waterMeterReading,
          electricityMeterReading,
          note,
          waterUnitPrice: latestWaterUnit,
          electricityUnitPrice: latestElecUnit,
          managementFee: latestMgmtFee,
        },
      });
      await recomputeInvoice(tx, id);
    });

    await logAudit({
      userId: ctx.id,
      module: "INVOICES",
      action: "UPDATE",
      targetType: "Invoice",
      targetId: id,
      changes: { after: { waterMeterReading, electricityMeterReading } },
    });

    revalidatePath("/finance/invoices");
    revalidatePath(`/finance/invoices/${id}`);
    return { ok: true as const };
  } catch (e) {
    console.error("[invoice:update]", e);
    return { error: "更新帳單失敗，請稍後再試" };
  }
}

// ─── 刪除帳單（僅 UNPAID 且無收款紀錄） ─────────────────────────────────────

export async function deleteInvoice(id: string) {
  const ctx = await requirePermission("INVOICES", "DELETE");

  const inv = await prisma.invoice.findUnique({
    where: { id },
    select: {
      status: true,
      contractId: true,
      _count: { select: { paymentRecords: true } },
    },
  });
  if (!inv) return { error: "帳單不存在" };
  if (inv._count.paymentRecords > 0) {
    return { error: "此帳單已有收款紀錄，不可刪除" };
  }
  if (inv.status !== "UNPAID" && inv.status !== "OVERDUE") {
    return { error: "僅未收款或逾期帳單可刪除" };
  }

  try {
    await prisma.invoice.delete({ where: { id } });
    await logAudit({
      userId: ctx.id,
      module: "INVOICES",
      action: "DELETE",
      targetType: "Invoice",
      targetId: id,
    });
  } catch (e) {
    console.error("[invoice:delete]", e);
    return { error: "刪除失敗，請稍後再試" };
  }

  revalidatePath("/finance/invoices");
  revalidatePath(`/contracts/${inv.contractId}`);
  redirect("/finance/invoices");
}

// ─── 收款紀錄：新增 / 編輯 / 刪除（每次都重算帳單狀態） ─────────────────────

type ParsedPayment = {
  paymentDate: Date;
  amount: number;
  paymentMethodId: string;
  note: string | null;
};

function parsePaymentForm(fd: FormData): { error: string } | ParsedPayment {
  const dateStr = (fd.get("paymentDate") as string)?.trim();
  const amountStr = (fd.get("amount") as string)?.trim();
  const paymentMethodId = (fd.get("paymentMethodId") as string)?.trim();
  const note = ((fd.get("note") as string) ?? "").trim() || null;

  if (!dateStr) return { error: "收款日期為必填" };
  const paymentDate = new Date(dateStr);
  if (Number.isNaN(+paymentDate)) return { error: "收款日期格式無效" };
  if (!paymentMethodId) return { error: "請選擇收款方式" };

  const amount = Number(amountStr);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "收款金額必須為正數" };
  }

  return { paymentDate, amount, paymentMethodId, note };
}

export async function createPaymentRecord(invoiceId: string, fd: FormData) {
  const ctx = await requirePermission("PAYMENTS", "CREATE");
  const parsed = parsePaymentForm(fd);
  if ("error" in parsed) return { error: parsed.error };

  const inv = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true },
  });
  if (!inv) return { error: "帳單不存在" };

  try {
    const created = await prisma.$transaction(async (tx) => {
      const pr = await tx.paymentRecord.create({
        data: { invoiceId, ...parsed },
      });
      await recomputeInvoice(tx, invoiceId);
      return pr;
    });

    await logAudit({
      userId: ctx.id,
      module: "PAYMENTS",
      action: "CREATE",
      targetType: "PaymentRecord",
      targetId: created.id,
      changes: { after: { invoiceId, amount: parsed.amount, paymentDate: parsed.paymentDate } },
    });

    revalidatePath("/finance/invoices");
    revalidatePath(`/finance/invoices/${invoiceId}`);
    return { ok: true as const, id: created.id };
  } catch (e) {
    console.error("[payment:create]", e);
    return { error: "新增收款失敗，請稍後再試" };
  }
}

export async function updatePaymentRecord(id: string, fd: FormData) {
  const ctx = await requirePermission("PAYMENTS", "EDIT");
  const parsed = parsePaymentForm(fd);
  if ("error" in parsed) return { error: parsed.error };

  const before = await prisma.paymentRecord.findUnique({
    where: { id },
    select: { invoiceId: true },
  });
  if (!before) return { error: "收款紀錄不存在" };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.paymentRecord.update({ where: { id }, data: parsed });
      await recomputeInvoice(tx, before.invoiceId);
    });

    await logAudit({
      userId: ctx.id,
      module: "PAYMENTS",
      action: "UPDATE",
      targetType: "PaymentRecord",
      targetId: id,
    });

    revalidatePath("/finance/invoices");
    revalidatePath(`/finance/invoices/${before.invoiceId}`);
    return { ok: true as const };
  } catch (e) {
    console.error("[payment:update]", e);
    return { error: "更新失敗，請稍後再試" };
  }
}

export async function deletePaymentRecord(id: string) {
  const ctx = await requirePermission("PAYMENTS", "DELETE");

  const before = await prisma.paymentRecord.findUnique({
    where: { id },
    select: { invoiceId: true },
  });
  if (!before) return { error: "收款紀錄不存在" };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.paymentRecord.delete({ where: { id } });
      await recomputeInvoice(tx, before.invoiceId);
    });

    await logAudit({
      userId: ctx.id,
      module: "PAYMENTS",
      action: "DELETE",
      targetType: "PaymentRecord",
      targetId: id,
    });

    revalidatePath("/finance/invoices");
    revalidatePath(`/finance/invoices/${before.invoiceId}`);
    return { ok: true as const };
  } catch (e) {
    console.error("[payment:delete]", e);
    return { error: "刪除失敗，請稍後再試" };
  }
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}
