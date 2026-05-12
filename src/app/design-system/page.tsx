import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Design System ｜ 房屋租賃管理系統",
};

/**
 * Phase 1.5 設計系統預覽頁。
 *
 * 用於檢視 globals.css 中 MD3 design tokens 應用後的真實樣貌，
 * 取得 feedback 後迭代調整 tokens，再進 Phase 2.1 登入頁。
 *
 * 路由：/design-system（無需登入）
 *
 * 8 個區塊：
 *   1. 色彩系統
 *   2. 字體階層
 *   3. 按鈕
 *   4. 表單元件
 *   5. 卡片
 *   6. 狀態標籤
 *   7. 列表表格
 *   8. 主版面預覽
 */
export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-surface-container">
      <TopNav />
      <main className="mx-auto max-w-6xl px-6 py-12 space-y-20">
        <HeaderBlock />
        <ColorsSection />
        <TypographySection />
        <ButtonsSection />
        <FormsSection />
        <CardsSection />
        <StatusChipsSection />
        <TablesSection />
        <LayoutPreviewSection />
        <FooterBlock />
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 頂部導覽（錨點跳轉）
// ═══════════════════════════════════════════════════════════════════════════

function TopNav() {
  const sections: Array<{ id: string; label: string }> = [
    { id: "colors", label: "色彩" },
    { id: "typography", label: "字體" },
    { id: "buttons", label: "按鈕" },
    { id: "forms", label: "表單" },
    { id: "cards", label: "卡片" },
    { id: "status", label: "狀態標籤" },
    { id: "tables", label: "表格" },
    { id: "layout", label: "版面預覽" },
  ];
  return (
    <nav className="sticky top-0 z-10 border-b border-outline-variant bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3 text-sm">
        <span className="font-medium text-on-surface">Design System</span>
        <div className="flex flex-wrap gap-1">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full px-3 py-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

function HeaderBlock() {
  return (
    <header className="pt-4">
      <p className="text-sm font-medium uppercase tracking-wider text-primary">
        Phase 1.5
      </p>
      <h1 className="mt-2 text-5xl font-medium leading-tight text-on-surface">
        房屋租賃管理系統
        <br />
        Design System
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-on-surface-variant">
        以 Google Material Design 3 為基礎、Tailwind v4 自刻元件。
        所有顏色與字體皆由 <code className="rounded bg-surface-container-high px-1.5 py-0.5 text-sm">globals.css</code> 的 design tokens 控制，
        調整 token 全站立刻同步。
      </p>
    </header>
  );
}

function FooterBlock() {
  return (
    <footer className="border-t border-outline-variant pt-8 text-sm text-on-surface-variant">
      看完後請就以下維度給 feedback：主色 · 狀態色 · 按鈕形狀 · 卡片圓角 · 整體風格 · 側邊欄寬度 · Top App Bar 高度
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 通用：區塊容器
// ═══════════════════════════════════════════════════════════════════════════

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-6 border-b border-outline-variant pb-3">
        <h2 className="text-2xl font-medium text-on-surface">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. 色彩系統
// ═══════════════════════════════════════════════════════════════════════════

function ColorsSection() {
  return (
    <Section
      id="colors"
      title="1. 色彩系統"
      description="MD3 color roles，分組展示。Tailwind utility 如 bg-primary、text-on-surface 直接對應這些 tokens。"
    >
      <div className="space-y-6">
        <ColorGroup
          title="Primary（主色 — 森林綠）"
          swatches={[
            { name: "primary", className: "bg-primary", textClass: "text-on-primary", hex: "#2D6A4F" },
            { name: "on-primary", className: "bg-on-primary ring-1 ring-outline-variant", textClass: "text-primary", hex: "#FFFFFF" },
            { name: "primary-container", className: "bg-primary-container", textClass: "text-on-primary-container", hex: "#B0EFC2" },
            { name: "on-primary-container", className: "bg-on-primary-container", textClass: "text-primary-container", hex: "#002112" },
          ]}
        />
        <ColorGroup
          title="Secondary（綠調中性灰）"
          swatches={[
            { name: "secondary", className: "bg-secondary", textClass: "text-on-secondary", hex: "#51635D" },
            { name: "on-secondary", className: "bg-on-secondary ring-1 ring-outline-variant", textClass: "text-secondary", hex: "#FFFFFF" },
            { name: "secondary-container", className: "bg-secondary-container", textClass: "text-on-secondary-container", hex: "#D4E8E0" },
            { name: "on-secondary-container", className: "bg-on-secondary-container", textClass: "text-secondary-container", hex: "#0F1F1B" },
          ]}
        />
        <ColorGroup
          title="Surface（背景／卡片 — 微綠白）"
          swatches={[
            { name: "background", className: "bg-background ring-1 ring-outline-variant", textClass: "text-on-surface", hex: "#F7FBF8" },
            { name: "surface", className: "bg-surface ring-1 ring-outline-variant", textClass: "text-on-surface", hex: "#F7FBF8" },
            { name: "surface-container", className: "bg-surface-container ring-1 ring-outline-variant", textClass: "text-on-surface", hex: "#ECF1ED" },
            { name: "surface-container-high", className: "bg-surface-container-high ring-1 ring-outline-variant", textClass: "text-on-surface", hex: "#E5EBE7" },
            { name: "surface-variant", className: "bg-surface-variant", textClass: "text-on-surface-variant", hex: "#DCE5DE" },
            { name: "on-surface", className: "bg-on-surface", textClass: "text-surface", hex: "#181D1A" },
            { name: "on-surface-variant", className: "bg-on-surface-variant", textClass: "text-surface", hex: "#404943" },
          ]}
        />
        <ColorGroup
          title="Outline（描邊／分隔線）"
          swatches={[
            { name: "outline", className: "bg-outline", textClass: "text-surface", hex: "#717873" },
            { name: "outline-variant", className: "bg-outline-variant", textClass: "text-on-surface", hex: "#C0C9C1" },
          ]}
        />
        <ColorGroup
          title="Error（錯誤／警告）"
          swatches={[
            { name: "error", className: "bg-error", textClass: "text-on-error", hex: "#B3261E" },
            { name: "on-error", className: "bg-on-error ring-1 ring-outline-variant", textClass: "text-error", hex: "#FFFFFF" },
            { name: "error-container", className: "bg-error-container", textClass: "text-on-error-container", hex: "#F9DEDC" },
          ]}
        />
        <ColorGroup
          title="Status（房間／合約／帳單狀態）"
          swatches={[
            { name: "status-rented", className: "bg-status-rented", textClass: "text-white", hex: "#2E7D32", note: "出租中 🟢" },
            { name: "status-overdue", className: "bg-status-overdue", textClass: "text-white", hex: "#B3261E", note: "合約逾期 🔴" },
            { name: "status-maintenance", className: "bg-status-maintenance", textClass: "text-white", hex: "#F9A825", note: "整修中 🟡" },
            { name: "status-vacant", className: "bg-status-vacant", textClass: "text-white", hex: "#79747E", note: "空置 ⚪" },
            { name: "status-completed", className: "bg-status-completed", textClass: "text-white", hex: "#1565C0", note: "已完成 🔵" },
          ]}
        />
      </div>
    </Section>
  );
}

function ColorGroup({
  title,
  swatches,
}: {
  title: string;
  swatches: Array<{
    name: string;
    className: string;
    textClass: string;
    hex: string;
    note?: string;
  }>;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-on-surface-variant">
        {title}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {swatches.map((s) => (
          <div key={s.name} className={`rounded-xl p-4 ${s.className}`}>
            <div className={`font-mono text-sm ${s.textClass}`}>{s.name}</div>
            <div className={`mt-1 font-mono text-xs opacity-75 ${s.textClass}`}>{s.hex}</div>
            {s.note && (
              <div className={`mt-1 text-xs ${s.textClass}`}>{s.note}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. 字體階層
// ═══════════════════════════════════════════════════════════════════════════

function TypographySection() {
  const samples: Array<{ name: string; className: string; size: string }> = [
    { name: "Display Medium", className: "text-5xl font-normal leading-tight", size: "48px / 56px" },
    { name: "Display Small", className: "text-4xl font-normal leading-tight", size: "36px / 44px" },
    { name: "Headline Large", className: "text-3xl font-normal leading-snug", size: "30px / 38px" },
    { name: "Headline Medium", className: "text-2xl font-normal leading-snug", size: "24px / 32px" },
    { name: "Headline Small", className: "text-xl font-medium leading-snug", size: "20px / 28px" },
    { name: "Title Large", className: "text-lg font-medium", size: "18px / 28px" },
    { name: "Title Medium", className: "text-base font-medium", size: "16px / 24px" },
    { name: "Body Large", className: "text-base font-normal", size: "16px / 24px" },
    { name: "Body Medium", className: "text-sm font-normal", size: "14px / 20px" },
    { name: "Label Large", className: "text-sm font-medium", size: "14px / 20px" },
    { name: "Label Small", className: "text-xs font-medium", size: "12px / 16px" },
  ];
  return (
    <Section
      id="typography"
      title="2. 字體階層"
      description="字體：Noto Sans TC（繁中）。所有 size 透過 Tailwind 對應 MD3 type scale。"
    >
      <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-outline-variant">
        <table className="w-full">
          <thead className="bg-surface-container-high text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
            <tr>
              <th className="px-6 py-3 w-44">階層</th>
              <th className="px-6 py-3 w-32">size</th>
              <th className="px-6 py-3">範例</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant text-on-surface">
            {samples.map((s) => (
              <tr key={s.name}>
                <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{s.name}</td>
                <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{s.size}</td>
                <td className={`px-6 py-4 ${s.className}`}>合約逾期提醒 1234</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. 按鈕
// ═══════════════════════════════════════════════════════════════════════════

const btnBase = "inline-flex h-10 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

function ButtonsSection() {
  return (
    <Section
      id="buttons"
      title="3. 按鈕"
      description="5 種變體 × normal/with-icon/disabled 三種狀態。MD3 預設按鈕高度 40px、圓角 full（膠囊形）。"
    >
      <div className="space-y-6">
        <ButtonRow label="Filled — 主要操作" buttons={["儲存合約", "新增", "確認"]} variantClass="bg-primary text-on-primary hover:bg-primary/90 active:bg-primary/80 shadow-sm" />
        <ButtonRow label="Tonal — 次要操作" buttons={["編輯", "匯出 Excel", "上傳 PDF"]} variantClass="bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80" />
        <ButtonRow label="Outlined — 替代操作" buttons={["取消", "回上一頁", "更多"]} variantClass="bg-transparent text-primary ring-1 ring-outline hover:bg-primary/8" />
        <ButtonRow label="Text — 第三選項" buttons={["忘記密碼", "查看詳情", "前往設定"]} variantClass="bg-transparent text-primary hover:bg-primary/8 px-4" />
        <ButtonRow label="Danger — 破壞性操作" buttons={["終止合約", "刪除房客", "停用帳號"]} variantClass="bg-error text-on-error hover:bg-error/90 shadow-sm" />
      </div>
    </Section>
  );
}

function ButtonRow({
  label,
  buttons,
  variantClass,
}: {
  label: string;
  buttons: string[];
  variantClass: string;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-on-surface-variant">
        {label}
      </h3>
      <div className="flex flex-wrap items-center gap-3">
        {buttons.map((b, i) => (
          <button key={b} type="button" className={`${btnBase} ${variantClass}`}>
            {i === 1 && <Icon name="plus" />}
            {b}
          </button>
        ))}
        <button type="button" disabled className={`${btnBase} ${variantClass}`}>
          停用狀態
        </button>
      </div>
    </div>
  );
}

function Icon({ name }: { name: "plus" | "search" | "chevron" }) {
  if (name === "plus") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
      </svg>
    );
  }
  if (name === "search") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. 表單元件
// ═══════════════════════════════════════════════════════════════════════════

function FormsSection() {
  return (
    <Section
      id="forms"
      title="4. 表單元件"
      description="MD3 outlined input：56px 高、圓角 8px、focus 時 ring-2 ring-primary。"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
          <FieldLabel>文字輸入</FieldLabel>
          <TextInput placeholder="請輸入合約名稱" />
          <FieldLabel>有預設值</FieldLabel>
          <TextInput defaultValue="2024 年度租約 — 101 室" />
          <FieldLabel>錯誤狀態</FieldLabel>
          <div>
            <TextInput defaultValue="abc" error />
            <p className="mt-1.5 text-sm text-error">身分證字號格式不正確</p>
          </div>
          <FieldLabel>下拉選單</FieldLabel>
          <SelectInput options={["套房", "雅房"]} />
          <FieldLabel>多行輸入</FieldLabel>
          <textarea
            rows={3}
            className="block w-full rounded-lg border-0 bg-surface px-4 py-3 text-on-surface ring-1 ring-inset ring-outline placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            placeholder="備註（最多 500 字）"
          />
        </div>
        <div className="space-y-6 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
          <div>
            <FieldLabel>Checkbox</FieldLabel>
            <div className="mt-2 space-y-2">
              <CheckboxRow label="水費另計" defaultChecked />
              <CheckboxRow label="電費另計" defaultChecked />
              <CheckboxRow label="管理費另計" />
              <CheckboxRow label="押金已收（停用）" disabled />
            </div>
          </div>
          <div>
            <FieldLabel>Radio Group — 房間類型</FieldLabel>
            <div className="mt-2 space-y-2">
              <RadioRow name="unit-type" label="套房" defaultChecked />
              <RadioRow name="unit-type" label="雅房" />
            </div>
          </div>
          <div>
            <FieldLabel>Switch — 啟用通知</FieldLabel>
            <div className="mt-2 space-y-3">
              <SwitchRow label="租約到期提醒" defaultChecked />
              <SwitchRow label="租金逾期提醒" />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-on-surface">
      {children}
    </label>
  );
}

function TextInput({
  defaultValue,
  placeholder,
  error,
}: {
  defaultValue?: string;
  placeholder?: string;
  error?: boolean;
}) {
  return (
    <input
      type="text"
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={`block w-full rounded-lg border-0 bg-surface px-4 py-3 text-on-surface ring-1 ring-inset placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-inset ${
        error ? "ring-error focus:ring-error" : "ring-outline focus:ring-primary"
      }`}
    />
  );
}

function SelectInput({ options }: { options: string[] }) {
  return (
    <select
      defaultValue={options[0]}
      className="block w-full rounded-lg border-0 bg-surface px-4 py-3 text-on-surface ring-1 ring-inset ring-outline focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

function CheckboxRow({
  label,
  defaultChecked,
  disabled,
}: {
  label: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-center gap-3 ${disabled ? "opacity-40" : ""}`}>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="h-5 w-5 rounded border-outline text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
      />
      <span className="text-on-surface">{label}</span>
    </label>
  );
}

function RadioRow({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-3">
      <input
        type="radio"
        name={name}
        defaultChecked={defaultChecked}
        className="h-5 w-5 border-outline text-primary focus:ring-2 focus:ring-primary"
      />
      <span className="text-on-surface">{label}</span>
    </label>
  );
}

function SwitchRow({
  label,
  defaultChecked,
}: {
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-on-surface">{label}</span>
      {/* 純 CSS switch（peer + checked: 偽類） */}
      <span className="relative inline-flex">
        <input
          type="checkbox"
          defaultChecked={defaultChecked}
          className="peer h-7 w-12 cursor-pointer appearance-none rounded-full bg-surface-variant ring-1 ring-inset ring-outline transition-colors checked:bg-primary checked:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        />
        <span className="pointer-events-none absolute left-1 top-1 h-5 w-5 rounded-full bg-outline transition-all peer-checked:left-6 peer-checked:bg-on-primary" />
      </span>
    </label>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. 卡片
// ═══════════════════════════════════════════════════════════════════════════

function CardsSection() {
  return (
    <Section
      id="cards"
      title="5. 卡片"
      description="3 種變體：Elevated（陰影）／ Filled（填色）／ Outlined（描邊）。圓角 1rem (rounded-2xl)。"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <CardElevated />
        <CardFilled />
        <CardOutlined />
      </div>
    </Section>
  );
}

function CardElevated() {
  return (
    <div className="rounded-2xl bg-surface p-6 shadow-md ring-1 ring-outline-variant/50">
      <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">Elevated</p>
      <h3 className="mt-1 text-lg font-medium text-on-surface">101 室</h3>
      <p className="mt-2 text-sm text-on-surface-variant">套房 · 8.5 坪 · 二樓</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-2xl font-medium text-on-surface">NT$18,000</span>
        <StatusChip status="rented" label="出租中" />
      </div>
    </div>
  );
}

function CardFilled() {
  return (
    <div className="rounded-2xl bg-surface-container-high p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">Filled</p>
      <h3 className="mt-1 text-lg font-medium text-on-surface">202 室</h3>
      <p className="mt-2 text-sm text-on-surface-variant">雅房 · 5 坪 · 二樓</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-2xl font-medium text-on-surface">NT$9,500</span>
        <StatusChip status="vacant" label="空置" />
      </div>
    </div>
  );
}

function CardOutlined() {
  return (
    <div className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
      <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">Outlined</p>
      <h3 className="mt-1 text-lg font-medium text-on-surface">301 室</h3>
      <p className="mt-2 text-sm text-on-surface-variant">套房 · 10 坪 · 三樓</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-2xl font-medium text-on-surface">NT$22,000</span>
        <StatusChip status="maintenance" label="整修中" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. 狀態標籤
// ═══════════════════════════════════════════════════════════════════════════

type StatusKey = "rented" | "overdue" | "maintenance" | "vacant" | "completed";

const STATUS_PALETTE: Record<StatusKey, { bgSolid: string; bgSoft: string; text: string; dot: string }> = {
  rented:      { bgSolid: "bg-status-rented",      bgSoft: "bg-status-rented/12",      text: "text-status-rented",      dot: "bg-status-rented" },
  overdue:     { bgSolid: "bg-status-overdue",     bgSoft: "bg-status-overdue/12",     text: "text-status-overdue",     dot: "bg-status-overdue" },
  maintenance: { bgSolid: "bg-status-maintenance", bgSoft: "bg-status-maintenance/15", text: "text-status-maintenance", dot: "bg-status-maintenance" },
  vacant:      { bgSolid: "bg-status-vacant",      bgSoft: "bg-status-vacant/15",      text: "text-status-vacant",      dot: "bg-status-vacant" },
  completed:   { bgSolid: "bg-status-completed",   bgSoft: "bg-status-completed/12",   text: "text-status-completed",   dot: "bg-status-completed" },
};

function StatusChip({ status, label, variant = "soft" }: { status: StatusKey; label: string; variant?: "soft" | "solid" }) {
  const p = STATUS_PALETTE[status];
  if (variant === "solid") {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white ${p.bgSolid}`}>
        {label}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${p.bgSoft} ${p.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
      {label}
    </span>
  );
}

function StatusChipsSection() {
  const all: Array<{ s: StatusKey; l: string }> = [
    { s: "rented", l: "出租中" },
    { s: "overdue", l: "合約逾期" },
    { s: "maintenance", l: "整修中" },
    { s: "vacant", l: "空置" },
    { s: "completed", l: "已完成" },
  ];
  return (
    <Section
      id="status"
      title="6. 狀態標籤"
      description="兩種變體：Soft（淺色背景 + 圓點 + 深色字）／ Solid（飽和色 + 白字）。"
    >
      <div className="space-y-6">
        <div className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-on-surface-variant">Soft（預設，列表頁用）</p>
          <div className="flex flex-wrap gap-3">
            {all.map((x) => <StatusChip key={x.s} status={x.s} label={x.l} variant="soft" />)}
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-on-surface-variant">Solid（高強調，dashboard 卡片用）</p>
          <div className="flex flex-wrap gap-3">
            {all.map((x) => <StatusChip key={x.s} status={x.s} label={x.l} variant="solid" />)}
          </div>
        </div>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. 列表表格
// ═══════════════════════════════════════════════════════════════════════════

function TablesSection() {
  const rows: Array<{
    no: string;
    floor: string;
    type: string;
    tenant: string;
    rent: string;
    due: string;
    status: { s: StatusKey; l: string };
  }> = [
    { no: "101", floor: "1F", type: "套房", tenant: "王小明", rent: "NT$18,000", due: "2026/06/01", status: { s: "rented", l: "出租中" } },
    { no: "102", floor: "1F", type: "套房", tenant: "李大華", rent: "NT$18,000", due: "2026/05/15", status: { s: "overdue", l: "合約逾期" } },
    { no: "201", floor: "2F", type: "雅房", tenant: "—", rent: "NT$9,500", due: "—", status: { s: "vacant", l: "空置" } },
    { no: "202", floor: "2F", type: "雅房", tenant: "—", rent: "NT$9,500", due: "—", status: { s: "maintenance", l: "整修中" } },
    { no: "301", floor: "3F", type: "套房", tenant: "陳美鈴", rent: "NT$22,000", due: "2027/01/01", status: { s: "rented", l: "出租中" } },
  ];
  return (
    <Section
      id="tables"
      title="7. 列表表格"
      description="hover row highlight、狀態標籤欄、最後一欄為操作。"
    >
      <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-outline-variant">
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-high px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-on-surface">房間列表（5）</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="search"
                placeholder="搜尋房間或房客..."
                className="h-9 w-64 rounded-full bg-surface pl-9 pr-4 text-sm ring-1 ring-inset ring-outline placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <Icon name="search" />
              </span>
            </div>
            <button type="button" className={`${btnBase} h-9 bg-primary text-on-primary hover:bg-primary/90`}>
              <Icon name="plus" />
              新增房間
            </button>
          </div>
        </div>
        <table className="w-full">
          <thead className="text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
            <tr>
              <th className="px-6 py-3">房間</th>
              <th className="px-6 py-3">樓層</th>
              <th className="px-6 py-3">類型</th>
              <th className="px-6 py-3">房客</th>
              <th className="px-6 py-3">租金</th>
              <th className="px-6 py-3">到期日</th>
              <th className="px-6 py-3">狀態</th>
              <th className="px-6 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
            {rows.map((r) => (
              <tr key={r.no} className="transition-colors hover:bg-surface-container">
                <td className="px-6 py-4 font-medium">{r.no}</td>
                <td className="px-6 py-4 text-on-surface-variant">{r.floor}</td>
                <td className="px-6 py-4 text-on-surface-variant">{r.type}</td>
                <td className="px-6 py-4">{r.tenant}</td>
                <td className="px-6 py-4 font-mono">{r.rent}</td>
                <td className="px-6 py-4 text-on-surface-variant">{r.due}</td>
                <td className="px-6 py-4">
                  <StatusChip status={r.status.s} label={r.status.l} />
                </td>
                <td className="px-6 py-4 text-right">
                  <button type="button" className="rounded-full px-3 py-1 text-sm text-primary hover:bg-primary/8">
                    詳情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. 主版面預覽（縮小示意）
// ═══════════════════════════════════════════════════════════════════════════

function LayoutPreviewSection() {
  return (
    <Section
      id="layout"
      title="8. 主版面預覽"
      description="Top App Bar（h-14 / 56px）+ Sidebar（w-56 / 224px）+ 內容區。實際登入後 Dashboard 框架。"
    >
      <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-outline-variant">
        {/* Top app bar */}
        <div className="flex h-14 items-center justify-between border-b border-outline-variant bg-surface px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.06l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 0 0 1.061 1.06l8.69-8.69Z" />
                <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.43Z" />
              </svg>
            </div>
            <span className="text-base font-medium text-on-surface">小白租賃管理</span>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="flex items-center gap-2 rounded-full bg-secondary-container px-3 py-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-on-primary">陳</div>
              <span className="text-sm text-on-secondary-container">陳小白</span>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <aside className="w-56 border-r border-outline-variant bg-surface-container py-4">
            <nav className="space-y-1 px-3">
              <NavItem icon="home" label="Dashboard" />
              <NavItem icon="building" label="房產管理" />
              <NavItem icon="users" label="房客管理" />
              <NavItem icon="doc" label="合約管理" />
              <NavItem icon="dollar" label="租金管理" active />
              <NavItem icon="chat" label="溝通與維修" />
              <div className="my-3 border-t border-outline-variant" />
              <NavItem icon="cog" label="系統設定" />
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 bg-surface-container/40 p-6">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">租金管理</p>
                <h2 className="mt-0.5 text-2xl font-medium text-on-surface">本月帳單</h2>
              </div>
              <button type="button" className={`${btnBase} bg-primary text-on-primary hover:bg-primary/90`}>
                <Icon name="plus" />
                產生帳單
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="已收款" value="12" tone="rented" />
              <MiniStat label="未收款" value="3" tone="vacant" />
              <MiniStat label="逾期" value="1" tone="overdue" />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function NavItem({
  label,
  active,
}: {
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-secondary-container text-on-secondary-container"
          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
      }`}
    >
      <span className={`inline-block h-5 w-5 rounded ${active ? "bg-primary" : "bg-outline"}`} />
      {label}
    </button>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: StatusKey;
}) {
  const p = STATUS_PALETTE[tone];
  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-outline-variant">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${p.dot}`} />
        <span className="text-sm text-on-surface-variant">{label}</span>
      </div>
      <p className={`mt-1 text-3xl font-medium ${p.text}`}>{value}</p>
    </div>
  );
}
