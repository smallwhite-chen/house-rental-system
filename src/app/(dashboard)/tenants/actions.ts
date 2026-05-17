"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

const MODULE = "TENANTS" as const;
const TARGET = "Tenant";

type TenantFormData = {
  name: string;
  idNumber: string;
  phone: string;
  email: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  note: string | null;
};

function parseForm(fd: FormData): TenantFormData | { error: string } {
  const name = (fd.get("name") as string)?.trim();
  const idNumber = (fd.get("idNumber") as string)?.trim().toUpperCase();
  const phone = (fd.get("phone") as string)?.trim();
  const email = (fd.get("email") as string)?.trim() || null;
  const emergencyContactName = (fd.get("emergencyContactName") as string)?.trim() || null;
  const emergencyContactPhone = (fd.get("emergencyContactPhone") as string)?.trim() || null;
  const note = (fd.get("note") as string)?.trim() || null;

  if (!name) return { error: "姓名為必填" };
  if (!idNumber) return { error: "身分證字號為必填" };
  if (!phone) return { error: "聯絡電話為必填" };
  if (note && note.length > 500) return { error: "備註長度不可超過 500 字" };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Email 格式不正確" };
  }

  return { name, idNumber, phone, email, emergencyContactName, emergencyContactPhone, note };
}

export async function createTenant(fd: FormData) {
  const ctx = await requirePermission(MODULE, "CREATE");
  const parsed = parseForm(fd);
  if ("error" in parsed) return { error: parsed.error };

  try {
    const item = await prisma.tenant.create({ data: parsed });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "CREATE",
      targetType: TARGET,
      targetId: item.id,
      changes: { after: parsed },
    });
    revalidatePath("/tenants");
    return { ok: true as const, id: item.id };
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return { error: "此身分證字號已存在於系統中" };
    }
    return { error: "建立失敗，請稍後再試" };
  }
}

export async function updateTenant(id: string, fd: FormData) {
  const ctx = await requirePermission(MODULE, "EDIT");
  const parsed = parseForm(fd);
  if ("error" in parsed) return { error: parsed.error };

  try {
    const before = await prisma.tenant.findUnique({
      where: { id },
      select: { name: true, phone: true, idNumber: true },
    });
    await prisma.tenant.update({ where: { id }, data: parsed });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "UPDATE",
      targetType: TARGET,
      targetId: id,
      changes: { before, after: parsed },
    });
    revalidatePath("/tenants");
    revalidatePath(`/tenants/${id}`);
    return { ok: true as const };
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return { error: "此身分證字號已存在於系統中" };
    }
    return { error: "更新失敗，請稍後再試" };
  }
}

export async function deleteTenant(id: string) {
  const ctx = await requirePermission(MODULE, "DELETE");

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: { name: true, _count: { select: { contracts: true } } },
  });
  if (!tenant) return { error: "房客不存在" };
  if (tenant._count.contracts > 0) {
    return {
      error: `此房客有 ${tenant._count.contracts} 份合約紀錄，無法刪除`,
    };
  }

  try {
    await prisma.tenant.delete({ where: { id } });
    await logAudit({
      userId: ctx.id,
      module: MODULE,
      action: "DELETE",
      targetType: TARGET,
      targetId: id,
      changes: { before: { name: tenant.name } },
    });
  } catch {
    return { error: "刪除失敗，請稍後再試" };
  }

  revalidatePath("/tenants");
  redirect("/tenants");
}
