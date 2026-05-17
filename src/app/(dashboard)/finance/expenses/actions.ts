"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ExpenseLevel } from "@/generated/prisma/client";

const MODULE = "EXPENSES" as const;
const TARGET = "Expense";

type ParsedExpense = {
  expenseTypeId: string;
  expenseDate: Date;
  amount: number;
  propertyId: string;
  level: ExpenseLevel;
  unitId: string | null;
  receiptUrl: string | null;
  note: string | null;
};

function parseForm(fd: FormData): { error: string } | ParsedExpense {
  const expenseTypeId = (fd.get("expenseTypeId") as string)?.trim();
  const dateStr = (fd.get("expenseDate") as string)?.trim();
  const amountStr = (fd.get("amount") as string)?.trim();
  const propertyId = (fd.get("propertyId") as string)?.trim();
  const levelRaw = (fd.get("level") as string)?.trim();
  const unitIdRaw = (fd.get("unitId") as string)?.trim();
  const receiptUrl = ((fd.get("receiptUrl") as string) ?? "").trim() || null;
  const note = ((fd.get("note") as string) ?? "").trim() || null;

  if (!expenseTypeId) return { error: "請選擇支出種類" };
  if (!dateStr) return { error: "支出日期為必填" };
  const expenseDate = new Date(dateStr);
  if (Number.isNaN(+expenseDate)) return { error: "支出日期格式無效" };
  const amount = Number(amountStr);
  if (!Number.isFinite(amount) || amount <= 0) return { error: "支出金額必須為正數" };
  if (!propertyId) return { error: "請選擇關聯房產" };
  if (levelRaw !== "PROPERTY" && levelRaw !== "UNIT") return { error: "請選擇支出層級" };
  const level = levelRaw as ExpenseLevel;
  const unitId = unitIdRaw || null;
  if (level === "UNIT" && !unitId) return { error: "層級為「房間」時，必須選擇關聯房間" };

  return { expenseTypeId, expenseDate, amount, propertyId, level, unitId, receiptUrl, note };
}

export async function createExpense(fd: FormData) {
  const ctx = await requirePermission(MODULE, "CREATE");
  const parsed = parseForm(fd);
  if ("error" in parsed) return { error: parsed.error };

  try {
    const item = await prisma.expense.create({
      data: {
        expenseTypeId: parsed.expenseTypeId,
        expenseDate: parsed.expenseDate,
        amount: parsed.amount,
        propertyId: parsed.propertyId,
        level: parsed.level,
        unitId: parsed.unitId,
        receiptUrl: parsed.receiptUrl,
        note: parsed.note,
      },
    });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "CREATE",
      targetType: TARGET,
      targetId: item.id,
      changes: { after: { amount: parsed.amount, propertyId: parsed.propertyId, level: parsed.level } },
    });
    revalidatePath("/finance/expenses");
    return { ok: true as const, id: item.id };
  } catch (e) {
    console.error("[expense:create]", e);
    return { error: "建立失敗，請稍後再試" };
  }
}

export async function updateExpense(id: string, fd: FormData) {
  const ctx = await requirePermission(MODULE, "EDIT");
  const parsed = parseForm(fd);
  if ("error" in parsed) return { error: parsed.error };

  try {
    await prisma.expense.update({
      where: { id },
      data: {
        expenseTypeId: parsed.expenseTypeId,
        expenseDate: parsed.expenseDate,
        amount: parsed.amount,
        propertyId: parsed.propertyId,
        level: parsed.level,
        unitId: parsed.unitId,
        receiptUrl: parsed.receiptUrl,
        note: parsed.note,
      },
    });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "UPDATE",
      targetType: TARGET,
      targetId: id,
    });
    revalidatePath("/finance/expenses");
    revalidatePath(`/finance/expenses/${id}/edit`);
    return { ok: true as const };
  } catch (e) {
    console.error("[expense:update]", e);
    return { error: "更新失敗，請稍後再試" };
  }
}

export async function deleteExpense(id: string) {
  const ctx = await requirePermission(MODULE, "DELETE");
  try {
    await prisma.expense.delete({ where: { id } });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "DELETE",
      targetType: TARGET,
      targetId: id,
    });
  } catch (e) {
    console.error("[expense:delete]", e);
    return { error: "刪除失敗，請稍後再試" };
  }
  revalidatePath("/finance/expenses");
  redirect("/finance/expenses");
}
