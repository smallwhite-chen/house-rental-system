"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { UnitStatus, UnitType } from "@/generated/prisma/client";

const MODULE = "PROPERTIES" as const; // 房間屬於房產模組
const TARGET = "Unit";

function s(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}
function n(v: FormDataEntryValue | null): number | null {
  const raw = s(v);
  if (!raw) return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

type UnitResult = { error?: string; id?: string };

export async function createUnit(propertyId: string, fd: FormData): Promise<UnitResult> {
  const ctx = await requirePermission(MODULE, "CREATE");

  const number = s(fd.get("number"));
  const floor = n(fd.get("floor"));
  const type = s(fd.get("type")) as UnitType;
  const area = n(fd.get("area"));
  const baseRent = n(fd.get("baseRent"));
  const note = s(fd.get("note")) || null;

  if (!number || floor === null || !type || baseRent === null) {
    return { error: "房間編號、樓層、類型、基本租金為必填" };
  }
  if (baseRent < 0) return { error: "基本租金不可為負數" };
  if (!["SUITE", "ROOM"].includes(type)) return { error: "房間類型不正確" };

  try {
    const item = await prisma.unit.create({
      data: { propertyId, number, floor, type, area, baseRent, note },
    });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "CREATE",
      targetType: TARGET,
      targetId: item.id,
      changes: { after: { propertyId, number, floor, type } },
    });
    revalidatePath(`/properties/${propertyId}`);
    return { id: item.id };
  } catch {
    return { error: "此房產內已有相同房間編號" };
  }
}

export async function updateUnit(unitId: string, fd: FormData): Promise<UnitResult> {
  const ctx = await requirePermission(MODULE, "EDIT");

  const number = s(fd.get("number"));
  const floor = n(fd.get("floor"));
  const type = s(fd.get("type")) as UnitType;
  const area = n(fd.get("area"));
  const baseRent = n(fd.get("baseRent"));
  const note = s(fd.get("note")) || null;
  const manualStatusRaw = s(fd.get("manualStatus"));
  // 表單只允許 "MAINTENANCE" 或空字串（清除手動覆寫）
  const manualStatus: UnitStatus | null =
    manualStatusRaw === "MAINTENANCE" ? "MAINTENANCE" : null;

  if (!number || floor === null || !type || baseRent === null) {
    return { error: "房間編號、樓層、類型、基本租金為必填" };
  }
  if (baseRent < 0) return { error: "基本租金不可為負數" };

  try {
    const before = await prisma.unit.findUnique({
      where: { id: unitId },
      select: { propertyId: true, number: true, floor: true, manualStatus: true },
    });
    if (!before) return { error: "房間不存在" };

    await prisma.unit.update({
      where: { id: unitId },
      data: { number, floor, type, area, baseRent, note, manualStatus },
    });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "UPDATE",
      targetType: TARGET,
      targetId: unitId,
      changes: { before, after: { number, floor, type, manualStatus } },
    });
    revalidatePath(`/properties/${before.propertyId}`);
    return { id: unitId };
  } catch {
    return { error: "此房產內已有相同房間編號" };
  }
}

export async function deleteUnit(unitId: string): Promise<{ error?: string }> {
  const ctx = await requirePermission(MODULE, "DELETE");

  const contractCount = await prisma.contract.count({ where: { unitId } });
  if (contractCount > 0) {
    return { error: `此房間有 ${contractCount} 份合約紀錄，請先處理合約後再刪除房間` };
  }

  try {
    const item = await prisma.unit.findUnique({
      where: { id: unitId },
      select: { propertyId: true, number: true },
    });
    if (!item) return { error: "房間不存在" };

    await prisma.unit.delete({ where: { id: unitId } });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "DELETE",
      targetType: TARGET,
      targetId: unitId,
      changes: { before: item },
    });
    revalidatePath(`/properties/${item.propertyId}`);
    return {};
  } catch {
    return { error: "刪除失敗，請稍後再試" };
  }
}
