"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { PropertyKind } from "@/generated/prisma/client";

const MODULE = "PROPERTIES" as const;
const TARGET = "Property";

/** WHOLE_BUILDING 房產的隱形 Unit number（SPEC §4 Q12）。 */
const WHOLE_UNIT_NUMBER = "整棟";

function s(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}
function n(v: FormDataEntryValue | null): number | null {
  const raw = s(v);
  if (!raw) return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

function parseKind(v: FormDataEntryValue | null): PropertyKind | null {
  const raw = s(v);
  if (raw === "WHOLE_BUILDING" || raw === "MULTI_UNIT") return raw;
  return null;
}

/** 取 fd 多個同名值，過濾空白；對應 MultiImageUpload 的 hidden inputs */
function strs(fd: FormData, key: string): string[] {
  return fd.getAll(key)
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
}

type PropertyResult = { error?: string; id?: string };

export async function createProperty(fd: FormData): Promise<PropertyResult> {
  const ctx = await requirePermission(MODULE, "CREATE");

  const kind = parseKind(fd.get("kind"));
  const name = s(fd.get("name"));
  const propertyTypeId = s(fd.get("propertyTypeId"));
  const city = s(fd.get("city"));
  const district = s(fd.get("district"));
  const address = s(fd.get("address"));
  const buildYear = n(fd.get("buildYear"));
  const totalFloors = n(fd.get("totalFloors"));
  const images = strs(fd, "images");
  const note = s(fd.get("note")) || null;

  if (!kind) return { error: "請選擇房產類型（整棟型 / 多單位型）" };
  if (!name || !propertyTypeId || !city || !district || !address) {
    return { error: "房產名稱、種類、縣市、行政區、地址為必填" };
  }

  // WHOLE_BUILDING 需要 baseRent；MULTI_UNIT 在房間設定，這裡不收
  let baseRent: number | null = null;
  if (kind === "WHOLE_BUILDING") {
    baseRent = n(fd.get("baseRent"));
    if (baseRent == null || !(baseRent >= 0)) {
      return { error: "整棟型房產必須輸入基本租金" };
    }
  }

  try {
    // Property + 隱形 Unit（僅 WHOLE）一起建立
    const item = await prisma.$transaction(async (tx) => {
      const property = await tx.property.create({
        data: { kind, name, propertyTypeId, city, district, address, buildYear, totalFloors, images, note },
      });

      if (kind === "WHOLE_BUILDING") {
        await tx.unit.create({
          data: {
            propertyId: property.id,
            number: WHOLE_UNIT_NUMBER,
            floor: 1,
            type: "SUITE", // 隱形 Unit 的 type 沒有意義，給一個合法值
            baseRent: baseRent!,
          },
        });
      }
      return property;
    });

    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "CREATE",
      targetType: TARGET,
      targetId: item.id,
      changes: { after: { kind, name, city, district, address } },
    });
    revalidatePath("/properties");
    return { id: item.id };
  } catch (e) {
    console.error("[property:create]", e);
    return { error: "建立失敗，請確認房產種類是否仍存在" };
  }
}

export async function updateProperty(id: string, fd: FormData): Promise<PropertyResult> {
  const ctx = await requirePermission(MODULE, "EDIT");

  const name = s(fd.get("name"));
  const propertyTypeId = s(fd.get("propertyTypeId"));
  const city = s(fd.get("city"));
  const district = s(fd.get("district"));
  const address = s(fd.get("address"));
  const buildYear = n(fd.get("buildYear"));
  const totalFloors = n(fd.get("totalFloors"));
  const images = strs(fd, "images");
  const note = s(fd.get("note")) || null;

  if (!name || !propertyTypeId || !city || !district || !address) {
    return { error: "房產名稱、種類、縣市、行政區、地址為必填" };
  }

  // 取出原 kind（kind 不可變更）
  const existing = await prisma.property.findUnique({
    where: { id },
    select: { kind: true, name: true, city: true, district: true, address: true },
  });
  if (!existing) return { error: "房產不存在" };

  // WHOLE_BUILDING 房產同步更新 baseRent 到隱形 Unit
  let newBaseRent: number | null = null;
  if (existing.kind === "WHOLE_BUILDING") {
    newBaseRent = n(fd.get("baseRent"));
    if (newBaseRent == null || !(newBaseRent >= 0)) {
      return { error: "整棟型房產必須輸入基本租金" };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.property.update({
        where: { id },
        data: { name, propertyTypeId, city, district, address, buildYear, totalFloors, images, note },
      });

      if (existing.kind === "WHOLE_BUILDING" && newBaseRent != null) {
        // 更新隱形 Unit baseRent；找此房產唯一的 Unit
        const unit = await tx.unit.findFirst({
          where: { propertyId: id },
          select: { id: true },
        });
        if (unit) {
          await tx.unit.update({
            where: { id: unit.id },
            data: { baseRent: newBaseRent },
          });
        }
      }
    });

    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "UPDATE",
      targetType: TARGET,
      targetId: id,
      changes: {
        before: { name: existing.name, city: existing.city, district: existing.district, address: existing.address },
        after: { name, city, district, address },
      },
    });
    revalidatePath("/properties");
    revalidatePath(`/properties/${id}`);
    return { id };
  } catch (e) {
    console.error("[property:update]", e);
    return { error: "更新失敗，請稍後再試" };
  }
}

export async function deleteProperty(id: string): Promise<{ error?: string }> {
  const ctx = await requirePermission(MODULE, "DELETE");

  const property = await prisma.property.findUnique({
    where: { id },
    select: { kind: true, name: true },
  });
  if (!property) return { error: "房產不存在" };

  // 計算「非隱形」單位數：WHOLE_BUILDING 永遠有 1 個隱形 Unit，刪除房產時要連同隱形 Unit 一起清掉
  const unitCount = await prisma.unit.count({ where: { propertyId: id } });
  const visibleUnitCount =
    property.kind === "WHOLE_BUILDING" ? Math.max(0, unitCount - 1) : unitCount;

  if (property.kind === "MULTI_UNIT" && visibleUnitCount > 0) {
    return { error: `此房產目前有 ${visibleUnitCount} 間房間，請先刪除所有房間後再刪除房產` };
  }

  // WHOLE_BUILDING：檢查隱形 Unit 上是否有合約
  if (property.kind === "WHOLE_BUILDING") {
    const contractCount = await prisma.contract.count({
      where: { unit: { propertyId: id } },
    });
    if (contractCount > 0) {
      return { error: `此房產有 ${contractCount} 份合約紀錄，請先刪除合約後再刪除房產` };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 先刪所有 Unit（WHOLE 模式下唯一的隱形 Unit）
      await tx.unit.deleteMany({ where: { propertyId: id } });
      await tx.property.delete({ where: { id } });
    });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "DELETE",
      targetType: TARGET,
      targetId: id,
      changes: { before: { name: property.name, kind: property.kind } },
    });
    revalidatePath("/properties");
    return {};
  } catch (e) {
    console.error("[property:delete]", e);
    return { error: "刪除失敗，請稍後再試" };
  }
}
