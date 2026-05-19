"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { PropertyKind } from "@/generated/prisma/client";

const PATH = "/settings/property-types";
const MODULE = "SETTINGS_PROPERTY_TYPES" as const;
const TARGET = "PropertyType";

function parseKind(v: FormDataEntryValue | null): PropertyKind | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (s === "WHOLE_BUILDING" || s === "MULTI_UNIT") return s;
  return null;
}

export async function createPropertyType(fd: FormData) {
  const ctx = await requirePermission(MODULE, "CREATE");
  const name = (fd.get("name") as string)?.trim();
  const description = (fd.get("description") as string)?.trim() || null;
  const kind = parseKind(fd.get("kind"));

  if (!name) return { error: "種類名稱為必填" };
  if (!kind) return { error: "請選擇此種類適用的房產類型" };

  try {
    const item = await prisma.propertyType.create({ data: { name, kind, description } });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "CREATE",
      targetType: TARGET,
      targetId: item.id,
      changes: { after: { name, kind, description } },
    });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "此種類名稱已存在，請使用不同名稱" };
  }
}

export async function updatePropertyType(id: string, fd: FormData) {
  const ctx = await requirePermission(MODULE, "EDIT");
  const name = (fd.get("name") as string)?.trim();
  const description = (fd.get("description") as string)?.trim() || null;
  const kind = parseKind(fd.get("kind"));

  if (!name) return { error: "種類名稱為必填" };
  if (!kind) return { error: "請選擇此種類適用的房產類型" };

  // Q3-B：種類「已被房產使用」時禁止變更 kind（避免邏輯不一致）
  const before = await prisma.propertyType.findUnique({
    where: { id },
    select: {
      name: true,
      kind: true,
      description: true,
      _count: { select: { properties: true } },
    },
  });
  if (!before) return { error: "種類不存在" };

  if (before.kind && before.kind !== kind && before._count.properties > 0) {
    return {
      error: `此種類已被 ${before._count.properties} 個房產使用，無法變更「適用房產類型」`,
    };
  }

  try {
    await prisma.propertyType.update({
      where: { id },
      data: { name, kind, description },
    });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "UPDATE",
      targetType: TARGET,
      targetId: id,
      changes: {
        before: { name: before.name, kind: before.kind, description: before.description },
        after: { name, kind, description },
      },
    });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "此種類名稱已存在，請使用不同名稱" };
  }
}

export async function deletePropertyType(id: string) {
  const ctx = await requirePermission(MODULE, "DELETE");
  try {
    const item = await prisma.propertyType.findUnique({ where: { id }, select: { name: true } });
    await prisma.propertyType.delete({ where: { id } });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "DELETE",
      targetType: TARGET,
      targetId: id,
      changes: { before: item },
    });
    revalidatePath(PATH);
    return {};
  } catch {
    return { error: "此種類正在被房產使用中，無法刪除" };
  }
}
