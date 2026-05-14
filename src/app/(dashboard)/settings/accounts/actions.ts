"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { AccountStatus } from "@/generated/prisma/client";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

type FieldErrors<T extends string> = Partial<Record<T, string>>;

/**
 * 重要：state 中的 `values` 用於 React 19 form action「自動 reset」後保留使用者輸入。
 * 密碼不放在 values 中——避免明碼在 client state 流轉，且安全考量上不便回填。
 * 當 action 回傳含 fieldErrors 時，前端會把 values 當 defaultValue 回填欄位。
 */
export type AccountFormValues = {
  name: string;
  email: string;
  roleId: string;
  status: string;
  note: string;
};

export type CreateAccountState = {
  error: string | null;
  fieldErrors: FieldErrors<"name" | "email" | "password" | "roleId" | "status" | "note">;
  success: boolean;
  values: AccountFormValues;
};

export type UpdateAccountState = {
  error: string | null;
  fieldErrors: FieldErrors<"name" | "email" | "roleId" | "status" | "note">;
  success: boolean;
  values: AccountFormValues;
};

export type ResetPasswordState = {
  error: string | null;
  newPassword: string | null; // 一次性顯示給管理者
};

// ═══════════════════════════════════════════════════════════════════════════
// Validation helpers
// ═══════════════════════════════════════════════════════════════════════════

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 驗證密碼規則（SPEC §3.2：最少 8 碼、需含大小寫英文+數字）。 */
function validatePassword(pwd: string): string | null {
  if (pwd.length < 8) return "密碼至少 8 碼";
  if (!/[a-z]/.test(pwd)) return "密碼需含小寫英文";
  if (!/[A-Z]/.test(pwd)) return "密碼需含大寫英文";
  if (!/\d/.test(pwd)) return "密碼需含數字";
  return null;
}

/** 用 crypto.randomBytes 產生強密碼（12 碼，至少含大小寫英文+數字）。 */
function generateStrongPassword(): string {
  // 取 16 bytes 編成 base64，去掉容易混淆的字元；保證足夠熵
  const raw = randomBytes(16).toString("base64").replace(/[+/=]/g, "");
  // 確保至少有大寫、小寫、數字各一
  const required = ["A", "b", "7"];
  // 取 9 碼 raw + 強制塞 3 碼，洗牌後取 12 碼
  const arr = (raw.slice(0, 9) + required.join("")).split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

/** 「至少保留 1 個啟用的 Super Admin」守衛。 */
async function assertNotLastActiveSuperAdmin(targetUserId: string): Promise<void> {
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { status: true, role: { select: { isSystem: true } } },
  });
  if (!target) throw new Error("帳號不存在");
  if (!target.role.isSystem || target.status !== "ACTIVE") return; // 不是 Super Admin 或本來就停用，無此風險

  const activeSuperAdminCount = await prisma.user.count({
    where: { role: { isSystem: true }, status: "ACTIVE" },
  });
  if (activeSuperAdminCount <= 1) {
    throw new LastSuperAdminError();
  }
}

class LastSuperAdminError extends Error {
  constructor() {
    super("系統至少需保留 1 個啟用中的 Super Admin");
    this.name = "LastSuperAdminError";
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// createAccountAction
// ═══════════════════════════════════════════════════════════════════════════

export async function createAccountAction(
  _prev: CreateAccountState,
  formData: FormData
): Promise<CreateAccountState> {
  const ctx = await requirePermission("SETTINGS_ACCOUNTS", "CREATE");

  const name = (formData.get("name") as string)?.trim() ?? "";
  const email = (formData.get("email") as string)?.trim().toLowerCase() ?? "";
  const password = (formData.get("password") as string) ?? "";
  const roleId = (formData.get("roleId") as string)?.trim() ?? "";
  const status = (formData.get("status") as string) === "DISABLED" ? "DISABLED" : "ACTIVE";
  const noteRaw = ((formData.get("note") as string) ?? "").trim();
  const note = noteRaw || null;

  // 保留欄位值（密碼除外）給 React 19 form-reset 後當 defaultValue 回填
  const values: AccountFormValues = {
    name,
    email,
    roleId,
    status,
    note: noteRaw,
  };

  const fieldErrors: CreateAccountState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "請填寫姓名";
  if (!email) {
    fieldErrors.email = "請填寫 Email";
  } else if (!EMAIL_REGEX.test(email)) {
    fieldErrors.email = "Email 格式不正確";
  }
  const pwdErr = validatePassword(password);
  if (pwdErr) fieldErrors.password = pwdErr;
  if (!roleId) fieldErrors.roleId = "請選擇角色";

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "請修正下列欄位", fieldErrors, success: false, values };
  }

  // Email 唯一檢查
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      error: null,
      fieldErrors: { email: "此 Email 已被使用" },
      success: false,
      values,
    };
  }

  // 確認 role 存在
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    return {
      error: null,
      fieldErrors: { roleId: "選定的角色不存在" },
      success: false,
      values,
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const created = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        roleId,
        status: status as AccountStatus,
        note,
      },
      select: { id: true, name: true, email: true, roleId: true, status: true },
    });

    await logAudit({
      userId: ctx.id,
      module: "SETTINGS_ACCOUNTS",
      action: "CREATE",
      targetType: "User",
      targetId: created.id,
      changes: {
        after: {
          name: created.name,
          email: created.email,
          roleId: created.roleId,
          status: created.status,
        },
      },
    });
  } catch (err) {
    console.error("[accounts] create failed", err);
    return { error: "建立帳號失敗，請稍後再試", fieldErrors: {}, success: false, values };
  }

  revalidatePath("/settings/accounts");
  redirect("/settings/accounts");
}

// ═══════════════════════════════════════════════════════════════════════════
// updateAccountAction
// ═══════════════════════════════════════════════════════════════════════════

export async function updateAccountAction(
  userId: string,
  _prev: UpdateAccountState,
  formData: FormData
): Promise<UpdateAccountState> {
  const ctx = await requirePermission("SETTINGS_ACCOUNTS", "EDIT");

  const name = (formData.get("name") as string)?.trim() ?? "";
  const email = (formData.get("email") as string)?.trim().toLowerCase() ?? "";
  const roleId = (formData.get("roleId") as string)?.trim() ?? "";
  const status = (formData.get("status") as string) === "DISABLED" ? "DISABLED" : "ACTIVE";
  const noteRaw = ((formData.get("note") as string) ?? "").trim();
  const note = noteRaw || null;

  // 保留使用者輸入給 React 19 form-reset 後當 defaultValue 回填
  const values: AccountFormValues = { name, email, roleId, status, note: noteRaw };

  const fieldErrors: UpdateAccountState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "請填寫姓名";
  if (!email) {
    fieldErrors.email = "請填寫 Email";
  } else if (!EMAIL_REGEX.test(email)) {
    fieldErrors.email = "Email 格式不正確";
  }
  if (!roleId) fieldErrors.roleId = "請選擇角色";

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "請修正下列欄位", fieldErrors, success: false, values };
  }

  // 載入現況做 audit before snapshot 與 last-Super-Admin 判斷
  const before = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: { select: { isSystem: true, name: true } } },
  });
  if (!before) {
    return { error: "帳號不存在", fieldErrors: {}, success: false, values };
  }

  // Email 變動 → 唯一檢查
  if (email !== before.email) {
    const conflict = await prisma.user.findUnique({ where: { email } });
    if (conflict) {
      return {
        error: null,
        fieldErrors: { email: "此 Email 已被使用" },
        success: false,
        values,
      };
    }
  }

  // 角色變動 → 確認 role 存在
  let newRoleIsSystem = before.role.isSystem;
  if (roleId !== before.roleId) {
    const newRole = await prisma.role.findUnique({
      where: { id: roleId },
      select: { isSystem: true },
    });
    if (!newRole) {
      return {
        error: null,
        fieldErrors: { roleId: "選定的角色不存在" },
        success: false,
        values,
      };
    }
    newRoleIsSystem = newRole.isSystem;
  }

  // 防呆：不允許停用／降級自己。
  // - 即使存在另一個 Super Admin 也擋下，避免管理員不小心自鎖。
  // - 若真的要把自己停用 / 移除權限，請由其他管理員操作。
  if (userId === ctx.id) {
    if (before.status === "ACTIVE" && status === "DISABLED") {
      return {
        error: "無法停用自己的帳號。請由其他管理員執行此操作。",
        fieldErrors: {},
        success: false,
        values,
      };
    }
    if (before.role.isSystem && !newRoleIsSystem) {
      return {
        error: "無法移除自己的 Super Admin 權限。請由其他管理員執行此操作。",
        fieldErrors: {},
        success: false,
        values,
      };
    }
  }

  // Last Super Admin 守衛：
  // 1. 把現役 Super Admin 改成非 Super Admin
  // 2. 把現役 Super Admin 停用
  const downgradingSuperAdmin =
    before.role.isSystem && !newRoleIsSystem;
  const disablingSuperAdmin =
    before.role.isSystem && before.status === "ACTIVE" && status === "DISABLED";
  if (
    (downgradingSuperAdmin && before.status === "ACTIVE") ||
    disablingSuperAdmin
  ) {
    try {
      await assertNotLastActiveSuperAdmin(userId);
    } catch (err) {
      if (err instanceof LastSuperAdminError) {
        return { error: err.message, fieldErrors: {}, success: false, values };
      }
      throw err;
    }
  }

  try {
    const after = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        roleId,
        status: status as AccountStatus,
        note,
      },
      select: { id: true, name: true, email: true, roleId: true, status: true, note: true },
    });

    await logAudit({
      userId: ctx.id,
      module: "SETTINGS_ACCOUNTS",
      action: "UPDATE",
      targetType: "User",
      targetId: userId,
      changes: {
        before: {
          name: before.name,
          email: before.email,
          roleId: before.roleId,
          status: before.status,
          note: before.note,
        },
        after: {
          name: after.name,
          email: after.email,
          roleId: after.roleId,
          status: after.status,
          note: after.note,
        },
      },
    });
  } catch (err) {
    console.error("[accounts] update failed", err);
    return { error: "更新帳號失敗，請稍後再試", fieldErrors: {}, success: false, values };
  }

  revalidatePath("/settings/accounts");
  revalidatePath(`/settings/accounts/${userId}`);
  return { error: null, fieldErrors: {}, success: true, values };
}

// ═══════════════════════════════════════════════════════════════════════════
// resetPasswordAction
// ═══════════════════════════════════════════════════════════════════════════

export async function resetPasswordAction(
  userId: string,
  _prev: ResetPasswordState
): Promise<ResetPasswordState> {
  const ctx = await requirePermission("SETTINGS_ACCOUNTS", "EDIT");

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!target) {
    return { error: "帳號不存在", newPassword: null };
  }

  const newPlain = generateStrongPassword();
  const hash = await bcrypt.hash(newPlain, 12);

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { password: hash },
    });
    await logAudit({
      userId: ctx.id,
      module: "SETTINGS_ACCOUNTS",
      action: "UPDATE",
      targetType: "User",
      targetId: userId,
      changes: { note: "password reset by admin" },
    });
  } catch (err) {
    console.error("[accounts] reset password failed", err);
    return { error: "重設密碼失敗", newPassword: null };
  }

  revalidatePath(`/settings/accounts/${userId}`);
  return { error: null, newPassword: newPlain };
}
