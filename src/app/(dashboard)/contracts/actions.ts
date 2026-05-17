"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { contractsOverlap } from "@/lib/contract-status";
import type { ContractStatus, EquipmentCondition } from "@/generated/prisma/client";

const MODULE = "CONTRACTS" as const;
const TARGET = "Contract";

// ─── Form payload helpers ────────────────────────────────────────────────────

type ParsedContract = {
  unitId: string;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  signedDate: Date;
  pdfUrl: string;
  note: string | null;
  signatorySameAsTenant: boolean;
  signatoryName: string;
  signatoryIdNumber: string;
  signatoryPhone: string;
};

type ParsedBilling = {
  actualRent: string;
  rentDueDay: number;
  paymentMethodId: string;
  bankAccountId: string | null;
  depositAmount: string | null;
  depositReceivedDate: Date | null;
  waterUnitPrice: string | null;
  electricityUnitPrice: string | null;
  managementFee: string | null;
};

type ParsedEquipment = {
  equipmentTypeId: string;
  quantity: number;
  condition: EquipmentCondition;
  note: string | null;
};

function s(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function n(fd: FormData, key: string): number | null {
  const raw = s(fd, key);
  if (!raw) return null;
  const v = Number(raw);
  return Number.isFinite(v) ? v : null;
}

function parseForm(fd: FormData): { error: string } | {
  contract: ParsedContract;
  billing: ParsedBilling;
  equipment: ParsedEquipment[];
} {
  const unitId = s(fd, "unitId");
  const tenantId = s(fd, "tenantId");
  const startStr = s(fd, "startDate");
  const endStr = s(fd, "endDate");
  const signedStr = s(fd, "signedDate");

  if (!unitId) return { error: "請選擇關聯房間" };
  if (!tenantId) return { error: "請選擇關聯房客" };
  if (!startStr || !endStr || !signedStr) return { error: "合約日期欄位為必填" };

  const startDate = new Date(startStr);
  const endDate = new Date(endStr);
  const signedDate = new Date(signedStr);
  if (Number.isNaN(+startDate) || Number.isNaN(+endDate) || Number.isNaN(+signedDate)) {
    return { error: "日期格式無效" };
  }
  if (endDate <= startDate) return { error: "合約結束日必須晚於開始日" };

  const pdfUrl = s(fd, "pdfUrl");
  if (!pdfUrl) return { error: "合約 PDF URL 為必填（Phase 6 storage 上線後將改為檔案上傳）" };

  const signatorySameAsTenant = s(fd, "signatorySameAsTenant") === "on";
  const signatoryName = s(fd, "signatoryName");
  const signatoryIdNumber = s(fd, "signatoryIdNumber").toUpperCase();
  const signatoryPhone = s(fd, "signatoryPhone");
  if (!signatoryName || !signatoryIdNumber || !signatoryPhone) {
    return { error: "簽約人姓名、身分證字號、電話為必填" };
  }

  // ─ BillingTerms ─
  const rentRaw = s(fd, "actualRent");
  const rentDueDay = Number(s(fd, "rentDueDay"));
  const paymentMethodId = s(fd, "paymentMethodId");

  if (!rentRaw || !(Number(rentRaw) > 0)) return { error: "請輸入有效的實際租金" };
  if (!Number.isInteger(rentDueDay) || rentDueDay < 1 || rentDueDay > 31) {
    return { error: "收租日必須為 1–31 之間的整數" };
  }
  if (!paymentMethodId) return { error: "請選擇收款方式" };

  const depositDateStr = s(fd, "depositReceivedDate");
  const billing: ParsedBilling = {
    actualRent: rentRaw,
    rentDueDay,
    paymentMethodId,
    bankAccountId: s(fd, "bankAccountId") || null,
    depositAmount: s(fd, "depositAmount") || null,
    depositReceivedDate: depositDateStr ? new Date(depositDateStr) : null,
    waterUnitPrice: s(fd, "waterUnitPrice") || null,
    electricityUnitPrice: s(fd, "electricityUnitPrice") || null,
    managementFee: s(fd, "managementFee") || null,
  };

  // ─ Equipment list ─
  // 欄位命名：equip_typeId_<n>, equip_qty_<n>, equip_cond_<n>, equip_note_<n>
  const equipment: ParsedEquipment[] = [];
  const seen = new Set<string>();
  for (const key of fd.keys()) {
    const m = key.match(/^equip_typeId_(\d+)$/);
    if (m) seen.add(m[1]);
  }
  for (const idx of seen) {
    const typeId = s(fd, `equip_typeId_${idx}`);
    if (!typeId) continue;
    const qty = Number(s(fd, `equip_qty_${idx}`));
    const cond = s(fd, `equip_cond_${idx}`) as EquipmentCondition;
    if (!Number.isInteger(qty) || qty < 1) return { error: "設備數量必須為正整數" };
    if (cond !== "GOOD" && cond !== "FAIR" && cond !== "DAMAGED") {
      return { error: "設備狀態無效" };
    }
    equipment.push({
      equipmentTypeId: typeId,
      quantity: qty,
      condition: cond,
      note: s(fd, `equip_note_${idx}`) || null,
    });
  }

  return {
    contract: {
      unitId,
      tenantId,
      startDate,
      endDate,
      signedDate,
      pdfUrl,
      note: s(fd, "note") || null,
      signatorySameAsTenant,
      signatoryName,
      signatoryIdNumber,
      signatoryPhone,
    },
    billing,
    equipment,
  };
}

// ─── 公開 API：給表單即時檢查用 ───────────────────────────────────────────────

/**
 * 即時檢查指定房間在某時間區段是否與既有合約衝突。
 * 由表單在使用者填寫起訖日時呼叫，避免送出後才發現重疊。
 *
 * 回傳：
 * - conflict = false → 無衝突
 * - conflict = true  → 衝突，message 為提示文字
 */
export async function checkContractConflict(
  unitId: string,
  startDateStr: string,
  endDateStr: string,
  excludeContractId?: string
): Promise<{ conflict: boolean; message?: string }> {
  await requirePermission(MODULE, "VIEW");

  if (!unitId || !startDateStr || !endDateStr) {
    return { conflict: false };
  }
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  if (Number.isNaN(+startDate) || Number.isNaN(+endDate)) return { conflict: false };
  if (endDate <= startDate) {
    return { conflict: true, message: "合約結束日必須晚於開始日" };
  }

  const msg = await checkUnitOverlap(unitId, startDate, endDate, excludeContractId);
  return msg ? { conflict: true, message: msg } : { conflict: false };
}

// ─── 同房間時間區段重疊檢查（內部使用） ──────────────────────────────────────

async function checkUnitOverlap(
  unitId: string,
  startDate: Date,
  endDate: Date,
  excludeContractId?: string
): Promise<string | null> {
  // 注意：SQL NULL 語意下，`manualStatus NOT IN (...)` 對 NULL 列回傳 NULL（falsy），
  // 會把「未被手動終結」的合約誤排除。需顯式以 OR 同時包含 NULL 與非終結狀態。
  const existing = await prisma.contract.findMany({
    where: {
      unitId,
      ...(excludeContractId ? { id: { not: excludeContractId } } : {}),
      OR: [
        { manualStatus: null },
        { manualStatus: { notIn: ["TERMINATED", "COMPLETED"] } },
      ],
    },
    select: { id: true, startDate: true, endDate: true },
  });
  const conflict = existing.find((c) => contractsOverlap(c, { startDate, endDate }));
  if (conflict) return "此房間在所選期間內已有有效合約，請調整起訖日";
  return null;
}

// ─── createContract ──────────────────────────────────────────────────────────

export async function createContract(fd: FormData) {
  const ctx = await requirePermission(MODULE, "CREATE");
  const parsed = parseForm(fd);
  if ("error" in parsed) return { error: parsed.error };

  const overlap = await checkUnitOverlap(
    parsed.contract.unitId,
    parsed.contract.startDate,
    parsed.contract.endDate
  );
  if (overlap) return { error: overlap };

  try {
    const created = await prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({ data: parsed.contract });
      await tx.billingTerms.create({
        data: { contractId: contract.id, ...parsed.billing },
      });
      if (parsed.equipment.length > 0) {
        await tx.equipmentItem.createMany({
          data: parsed.equipment.map((e) => ({ contractId: contract.id, ...e })),
        });
      }
      return contract;
    });

    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "CREATE",
      targetType: TARGET,
      targetId: created.id,
      changes: { after: { unitId: created.unitId, tenantId: created.tenantId } },
    });

    revalidatePath("/contracts");
    revalidatePath(`/properties/${created.unitId}`); // 房間狀態自動更新
    return { ok: true as const, id: created.id };
  } catch (e) {
    console.error("[contract:create]", e);
    return { error: "建立合約失敗，請稍後再試" };
  }
}

// ─── updateContract（不可改 unit/tenant） ────────────────────────────────────

export async function updateContract(id: string, fd: FormData) {
  const ctx = await requirePermission(MODULE, "EDIT");
  const parsed = parseForm(fd);
  if ("error" in parsed) return { error: parsed.error };

  const existing = await prisma.contract.findUnique({
    where: { id },
    select: { unitId: true, tenantId: true },
  });
  if (!existing) return { error: "合約不存在" };

  // 強制保留原 unit/tenant（避免人為篡改 hidden field）
  parsed.contract.unitId = existing.unitId;
  parsed.contract.tenantId = existing.tenantId;

  const overlap = await checkUnitOverlap(
    existing.unitId,
    parsed.contract.startDate,
    parsed.contract.endDate,
    id
  );
  if (overlap) return { error: overlap };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.contract.update({ where: { id }, data: parsed.contract });
      await tx.billingTerms.upsert({
        where: { contractId: id },
        update: parsed.billing,
        create: { contractId: id, ...parsed.billing },
      });
      // 設備清單採全量重建（簡單可靠）
      await tx.equipmentItem.deleteMany({ where: { contractId: id } });
      if (parsed.equipment.length > 0) {
        await tx.equipmentItem.createMany({
          data: parsed.equipment.map((e) => ({ contractId: id, ...e })),
        });
      }
    });

    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "UPDATE",
      targetType: TARGET,
      targetId: id,
    });

    revalidatePath("/contracts");
    revalidatePath(`/contracts/${id}`);
    revalidatePath(`/properties/${existing.unitId}`);
    return { ok: true as const };
  } catch (e) {
    console.error("[contract:update]", e);
    return { error: "更新合約失敗，請稍後再試" };
  }
}

// ─── terminate / complete ────────────────────────────────────────────────────

async function setContractManualStatus(id: string, status: ContractStatus, ctxId: string) {
  const before = await prisma.contract.findUnique({
    where: { id },
    select: { unitId: true, manualStatus: true },
  });
  if (!before) return { error: "合約不存在" };

  await prisma.contract.update({ where: { id }, data: { manualStatus: status } });
  await logAudit({
    userId: ctxId,
    module: MODULE,
    action: "UPDATE",
    targetType: TARGET,
    targetId: id,
    changes: { before: { manualStatus: before.manualStatus }, after: { manualStatus: status } },
  });

  revalidatePath("/contracts");
  revalidatePath(`/contracts/${id}`);
  revalidatePath(`/properties/${before.unitId}`);
  return { ok: true as const };
}

export async function terminateContract(id: string) {
  const ctx = await requirePermission(MODULE, "EDIT");
  return setContractManualStatus(id, "TERMINATED", ctx.id);
}

export async function completeContract(id: string) {
  const ctx = await requirePermission(MODULE, "EDIT");
  return setContractManualStatus(id, "COMPLETED", ctx.id);
}

// ─── deleteContract（保留：只允許未產生任何帳單時刪除） ──────────────────────

export async function deleteContract(id: string) {
  const ctx = await requirePermission(MODULE, "DELETE");
  const contract = await prisma.contract.findUnique({
    where: { id },
    select: { unitId: true, _count: { select: { invoices: true } } },
  });
  if (!contract) return { error: "合約不存在" };
  if (contract._count.invoices > 0) {
    return { error: `此合約已產生 ${contract._count.invoices} 張帳單，無法刪除` };
  }

  try {
    await prisma.contract.delete({ where: { id } });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "DELETE",
      targetType: TARGET,
      targetId: id,
    });
  } catch (e) {
    console.error("[contract:delete]", e);
    return { error: "刪除失敗，請稍後再試" };
  }

  revalidatePath("/contracts");
  revalidatePath(`/properties/${contract.unitId}`);
  redirect("/contracts");
}
