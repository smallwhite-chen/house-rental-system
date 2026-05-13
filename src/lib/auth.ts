import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

/**
 * Provider 啟用策略：
 * - Credentials：永遠啟用（公司管理者登入主要管道）
 * - Google / GitHub：環境變數有 client id + secret 才啟用（規格保留架構，預設關閉）
 *
 * 開啟 OAuth：在 .env 填入對應的 AUTH_GOOGLE_ID/SECRET 或 AUTH_GITHUB_ID/SECRET。
 */
const providers: NextAuthConfig["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const user = await prisma.user.findUnique({
        where: { email: credentials.email as string },
      });

      if (!user || !user.password) return null;

      // SPEC §3.2：停用狀態的帳號不允許登入
      if (user.status !== "ACTIVE") return null;

      const isValid = await bcrypt.compare(
        credentials.password as string,
        user.password
      );

      if (!isValid) return null;

      return user;
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  events: {
    /**
     * 登入成功時記錄稽核日誌（SPEC §3.11）。
     * authorize() 內已驗證帳密，事件觸發時 user 必定有效。
     */
    async signIn({ user }) {
      if (user?.id) {
        await logAudit({ userId: user.id, action: "LOGIN" });
      }
    },
    /**
     * 登出時記錄稽核日誌。
     * JWT strategy 下 signOut 事件帶 token，session strategy 才帶 session。
     */
    async signOut(message) {
      const userId =
        "token" in message && message.token?.sub
          ? message.token.sub
          : "session" in message && message.session?.userId
            ? message.session.userId
            : undefined;
      if (userId) {
        await logAudit({ userId, action: "LOGOUT" });
      }
    },
  },
});
