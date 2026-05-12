# 房屋租賃管理系統 — Claude Code 開發指引

> 本文件供 Claude Code 自動讀取，作為開發的核心依據。
> 完整功能規格請參考專案根目錄的 `SPEC.md`。

---

## 專案概述

這是一個房屋租賃管理系統，供公司（房東）管理旗下房產、房客、合約與租金收支。

---

## 技術堆疊

| 項目 | 技術 |
|------|------|
| 前端框架 | Next.js 15（App Router） |
| 程式語言 | TypeScript |
| 樣式 | Tailwind CSS |
| ORM | Prisma v7 |
| 資料庫 | PostgreSQL（Supabase 託管） |
| 身份驗證 | NextAuth.js v5 |
| 部署平台 | Vercel |
| 版本控制 | GitHub |

---

## 重要技術細節

- **Supabase 連線**：使用 Session pooler，不使用 Direct connection（IPv4 相容性問題）
- **NextAuth 登入**：支援 Credentials / Google / GitHub
- **角色 enum**：LANDLORD / TENANT（目前僅實作 LANDLORD，TENANT 架構預留）
- **設計系統**：Google Material Design 3
- **系統自稱**：介面中統一使用「公司」，不使用「房東」

---

## 專案結構

```
/app
  /api                    → API Routes（後端邏輯）
  /(auth)                 → 登入／登出頁面
  /(dashboard)            → 主系統頁面（需登入）
    /settings             → 系統設定
      /general            → 系統基本設定
      /accounts           → 帳號管理
      /roles              → 角色管理
      /notifications      → 通知與提醒設定
      /payment-methods    → 收款方式管理
      /property-types     → 房產種類管理
      /income-types       → 收入種類管理
      /expense-types      → 支出種類管理
      /equipment-types    → 設備種類管理
      /communication-tags → 溝通標籤管理
      /audit-log          → 稽核紀錄
    /properties           → 房產管理
    /tenants              → 房客管理
    /contracts            → 合約管理
    /finance              → 租金管理
      /invoices           → 帳單管理
      /payments           → 收款紀錄
      /reports            → 財務報表
      /expenses           → 支出管理
    /communications       → 溝通與維修
/components               → 共用元件
/lib                      → 工具函式、Prisma Client、NextAuth 設定
/prisma                   → Schema 定義
/public                   → 靜態資源
```

---

## 開發原則

1. **嚴格按照 SPEC.md 規格開發**，不自行增減功能
2. 所有頁面使用 **Next.js App Router** 架構
3. 所有程式碼使用 **TypeScript**，不使用 any 型別
4. 樣式使用 **Tailwind CSS**，遵循 **Google Material Design 3** 設計規範
5. 資料存取一律透過 **Prisma ORM**，不直接撰寫 SQL
6. API Routes 放在 `/app/api/` 目錄下
7. 共用元件放在 `/components/` 目錄下
8. 每個功能模組獨立開發，確保模組間低耦合

---

## RBAC 權限設計

- **Super Admin**：系統內建，擁有所有權限，不可修改
- **自訂角色**：管理者可自行新增，針對各模組設定檢視／新增／編輯／刪除權限
- 系統強制至少保留 1 個 Super Admin 帳號
- 角色已被帳號使用時，不可刪除

---

## 資料關聯架構

```
Property（房產）
  └── Unit（房間）
        └── Contract（合約）─── Tenant（房客）
               ├── EquipmentList（設備清單）
               └── BillingTerms（租金條件）
                     └── Invoice（帳單）
                           └── PaymentRecord（收款紀錄）
CommunicationLog（溝通紀錄）─── Unit ＋ Tenant
ExpenseRecord（支出紀錄）─── Property ／ Unit
```

---

## 房間出租狀態規則

| 狀態 | 判斷方式 |
|------|------|
| 出租中 | 系統自動（有效合約存在） |
| 合約逾期 | 系統自動（合約到期，尚未退租） |
| 空置 | 系統自動（無合約，無人居住） |
| 整修中 | 管理者手動設定 |

---

## 帳單自動產生規則

- 合約收租日前 **7 天**自動產生帳單
- 固定費用（租金、管理費）自動帶入
- 水費／電費度數由管理者手動填入，系統自動計算金額
- 逾期認定：超過收租日當天即視為逾期

---

## 完整規格參考

開發前請務必閱讀 `SPEC.md` 對應章節：

| 模組 | SPEC.md 章節 |
|------|------|
| 系統設定 | 第 4 章 |
| 房產管理 | 第 5 章 |
| 房客管理 | 第 6 章 |
| 合約管理 | 第 7 章 |
| 租金管理 | 第 8 章 |
| 溝通與維修 | 第 9 章 |
| Dashboard | 第 10 章 |
