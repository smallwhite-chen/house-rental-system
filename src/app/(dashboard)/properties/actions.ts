"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

const MODULE = "PROPERTIES" as const;
const TARGET = "Property";

function s(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}
function n(v: FormDataEntryValue | null): number | null {
  const raw = s(v);
  if (!raw) return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

type PropertyResult = { error?: string; id?: string };

export async function createProperty(fd: FormData): Promise<PropertyResult> {
  const ctx = await requirePermission(MODULE, "CREATE");

  const name = s(fd.get("name"));
  const propertyTypeId = s(fd.get("propertyTypeId"));
  const city = s(fd.get("city"));
  const district = s(fd.get("district"));
  const address = s(fd.get("address"));
  const buildYear = n(fd.get("buildYear"));
  const totalFloors = n(fd.get("totalFloors"));
  const note = s(fd.get("note")) || null;

  if (!name || !propertyTypeId || !city || !district || !address) {
    return { error: "房產名稱、種類、縣市、行政區、地址為必填" };
  }

  try {
    const item = await prisma.property.create({
      data: { name, propertyTypeId, city, district, address, buildYear, totalFloors, note },
    });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "CREATE",
      targetType: TARGET,
      targetId: item.id,
      changes: { after: { name, city, district, address } },
    });
    revalidatePath("/properties");
    return { id: item.id };
  } catch {
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
  const note = s(fd.get("note")) || null;

  if (!name || !propertyTypeId || !city || !district || !address) {
    return { error: "房產名稱、種類、縣市、行政區、地址為必填" };
  }

  try {
    const before = await prisma.property.findUnique({
      where: { id },
      select: { name: true, city: true, district: true, address: true },
    });
    await prisma.property.update({
      where: { id },
      data: { name, propertyTypeId, city, district, address, buildYear, totalFloors, note },
    });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "UPDATE",
      targetType: TARGET,
      targetId: id,
      changes: { before, after: { name, city, district, address } },
    });
    revalidatePath("/properties");
    revalidatePath(`/properties/${id}`);
    return { id };
  } catch {
    return { error: "更新失敗，請稍後再試" };
  }
}

export async function deleteProperty(id: string): Promise<{ error?: string }> {
  const ctx = await requirePermission(MODULE, "DELETE");

  // 有房間時禁止刪除（避免級聯影響合約／帳單）
  const unitCount = await prisma.unit.count({ where: { propertyId: id } });
  if (unitCount > 0) {
    return { error: `此房產目前有 ${unitCount} 間房間，請先刪除所有房間後再刪除房產` };
  }

  try {
    const item = await prisma.property.findUnique({ where: { id }, select: { name: true } });
    await prisma.property.delete({ where: { id } });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "DELETE",
      targetType: TARGET,
      targetId: id,
      changes: { before: item },
    });
    revalidatePath("/properties");
    return {};
  } catch {
    return { error: "刪除失敗，請稍後再試" };
  }
}
