import "next-auth";
import type { DefaultSession } from "next-auth";

/**
 * Session 型別擴充
 *
 * Phase 0：僅補上 user.id（NextAuth 預設 Session.user 沒有 id）。
 * Phase 2 RBAC 上線後會再加：
 *   - user.roleId
 *   - user.permissions: Record<ModuleKey, PermissionSet>
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
  }
}
