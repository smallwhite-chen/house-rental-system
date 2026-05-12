/**
 * 房屋租賃管理系統 — Database Seed
 *
 * 此腳本只 seed「系統內建必要資料」，不灌入示範資料：
 *   1. Super Admin Role（不可刪除／修改的內建角色）
 *   2. Super Admin User（首位管理者帳號）
 *   3. 通知事件模板（SPEC §3.4 預定義的 8 個事件）
 *   4. 預設付款方式（現金、匯款）
 *
 * 公司基本資料、種類資料表（房產種類、設備種類等）皆留給管理者首次登入後自行設定。
 *
 * 執行方式：
 *   npx prisma db seed
 *   （或：tsx prisma/seed.ts）
 *
 * 採 upsert 策略，可重複執行不會產生重複資料。
 */

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import {
  PrismaClient,
  NotificationEventKey,
  NotificationEventType,
} from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SUPER_ADMIN = {
  name: "陳小白",
  email: "smallwhite01@gmail.com",
  password: "password", // ⚠️ 弱密碼，首次登入後請立即更換
} as const;

const NOTIFICATION_TEMPLATES: ReadonlyArray<{
  key: NotificationEventKey;
  type: NotificationEventType;
  name: string;
}> = [
  { key: "CONTRACT_CREATED", type: "EVENT", name: "合約建立" },
  { key: "CONTRACT_EXPIRING", type: "SCHEDULED", name: "租約到期" },
  { key: "CONTRACT_RENEWAL_DUE", type: "SCHEDULED", name: "租約即將續約" },
  { key: "CONTRACT_TERMINATED", type: "EVENT", name: "合約終止" },
  { key: "INVOICE_GENERATED", type: "EVENT", name: "租金帳單產生" },
  { key: "RENT_DUE_SOON", type: "SCHEDULED", name: "租金即將到期" },
  { key: "RENT_OVERDUE", type: "SCHEDULED", name: "租金逾期" },
  { key: "PAYMENT_RECEIVED", type: "EVENT", name: "租金收款完成" },
];

const DEFAULT_PAYMENT_METHODS: ReadonlyArray<string> = ["現金", "匯款"];

async function main(): Promise<void> {
  // 1. Super Admin Role
  const superAdminRole = await prisma.role.upsert({
    where: { name: "Super Admin" },
    update: {},
    create: {
      name: "Super Admin",
      description: "系統內建最高權限角色，擁有所有模組所有操作權限。不可修改或刪除。",
      isSystem: true,
    },
  });
  console.log(`✓ Role: Super Admin (${superAdminRole.id})`);

  // 2. Super Admin User
  const passwordHash = await bcrypt.hash(SUPER_ADMIN.password, 12);
  const superAdminUser = await prisma.user.upsert({
    where: { email: SUPER_ADMIN.email },
    update: {
      // 已存在則不覆蓋密碼（避免 seed 重跑把使用者改過的密碼蓋回去）
      name: SUPER_ADMIN.name,
      roleId: superAdminRole.id,
      status: "ACTIVE",
    },
    create: {
      name: SUPER_ADMIN.name,
      email: SUPER_ADMIN.email,
      password: passwordHash,
      roleId: superAdminRole.id,
      status: "ACTIVE",
    },
  });
  console.log(`✓ User: ${superAdminUser.email} (${superAdminUser.id})`);

  // 3. Notification Event Templates
  for (const tpl of NOTIFICATION_TEMPLATES) {
    await prisma.notificationEventTemplate.upsert({
      where: { eventKey: tpl.key },
      update: {}, // 不覆蓋使用者已編輯的 displayName / enabled
      create: {
        eventKey: tpl.key,
        eventType: tpl.type,
        displayName: tpl.name,
        enabled: true,
      },
    });
  }
  console.log(`✓ NotificationEventTemplates: ${NOTIFICATION_TEMPLATES.length} 筆`);

  // 4. Default Payment Method Categories
  for (const name of DEFAULT_PAYMENT_METHODS) {
    await prisma.paymentMethodCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✓ PaymentMethodCategories: ${DEFAULT_PAYMENT_METHODS.join(", ")}`);

  console.log("\n🌱 Seed completed.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
