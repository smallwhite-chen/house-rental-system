/**
 * RBAC service layer（SPEC §3.3）。
 *
 * 提供：
 * - getCurrentUserContext()  讀取目前登入使用者完整資料（含角色與權限明細）
 * - hasPermission(ctx, ...)   判斷是否擁有指定模組×操作的權限
 * - requireUserContext()      Server Component / Action 中強制要求已登入
 * - requirePermission(...)    強制要求擁有指定權限，否則導向 /forbidden
 *
 * 設計：
 * - 採 React `cache()`：同一個 request 中無論被呼叫幾次，DB 只查一次。
 * - Super Admin (Role.isSystem = true) 視為擁有所有權限，permissions 陣列保持空白，
 *   hasPermission() 直接返回 true，避免在 RolePermission 表中展開 N×M 筆冗餘資料。
 * - 停用帳號（status !== ACTIVE）視為未登入，強制重新登入。
 */
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type {
  ModuleKey,
  PermissionAction,
} from "@/generated/prisma/client";

export type Permission = {
  module: ModuleKey;
  action: PermissionAction;
};

export type UserContext = {
  id: string;
  name: string;
  email: string;
  role: {
    id: string;
    name: string;
    isSystem: boolean;
  };
  /** Super Admin 為空（hasPermission 直接放行）；其他角色列出全部授權項目。 */
  permissions: Permission[];
};

/**
 * 讀取目前 session 對應的使用者資料。
 *
 * 回傳 null 的情境：
 * - 沒有 session（未登入）
 * - session 指向的 User 已不存在
 * - User.status !== ACTIVE
 */
export const getCurrentUserContext = cache(
  async (): Promise<UserContext | null> => {
    const session = await auth();
    if (!session?.user?.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        role: {
          include: {
            permissions: {
              select: { module: true, action: true },
            },
          },
        },
      },
    });

    if (!user || user.status !== "ACTIVE") return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: {
        id: user.role.id,
        name: user.role.name,
        isSystem: user.role.isSystem,
      },
      permissions: user.role.isSystem
        ? []
        : user.role.permissions.map((p) => ({
            module: p.module,
            action: p.action,
          })),
    };
  }
);

/**
 * 純函式：判斷 UserContext 是否擁有指定權限。
 * - Super Admin（isSystem）→ 永遠 true
 * - 其他角色 → 檢查 permissions 陣列
 */
export function hasPermission(
  ctx: UserContext,
  module: ModuleKey,
  action: PermissionAction
): boolean {
  if (ctx.role.isSystem) return true;
  return ctx.permissions.some(
    (p) => p.module === module && p.action === action
  );
}

/**
 * 強制要求已登入。未登入 → 導向 /signin。
 * Server Component / Server Action 使用。
 */
export async function requireUserContext(): Promise<UserContext> {
  const ctx = await getCurrentUserContext();
  if (!ctx) {
    redirect("/signin");
  }
  return ctx;
}

/**
 * 強制要求擁有指定權限。
 * - 未登入 → /signin
 * - 已登入但無權限 → /forbidden
 *
 * 回傳 UserContext 供呼叫端後續使用，避免 Server Component 再多查一次。
 */
export async function requirePermission(
  module: ModuleKey,
  action: PermissionAction
): Promise<UserContext> {
  const ctx = await requireUserContext();
  if (!hasPermission(ctx, module, action)) {
    redirect("/forbidden");
  }
  return ctx;
}
