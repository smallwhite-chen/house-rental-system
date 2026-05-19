"use client";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { FormField } from "@/components/ui/FormField";
import { Select, SelectChevron } from "@/components/ui/Select";
import { FileUpload } from "@/components/ui/FileUpload";
import { uploadFileAction } from "@/app/actions/upload";
import type { EquipmentCondition } from "@/generated/prisma/client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PropertyOption = {
  id: string;
  name: string;
  kind: "WHOLE_BUILDING" | "MULTI_UNIT";
};

export type UnitOption = {
  id: string;
  number: string;
  propertyId: string;
  propertyName: string;
  baseRent: string;
};

export type TenantOption = {
  id: string;
  name: string;
  idNumber: string;
  phone: string;
};

export type PaymentMethodOption = { id: string; name: string };
export type BankAccountOption = { id: string; label: string };
export type EquipmentTypeOption = { id: string; name: string };

export type EquipmentInitial = {
  equipmentTypeId: string;
  quantity: number;
  condition: EquipmentCondition;
  note: string | null;
};

export type ContractFormInitial = {
  unitId?: string;
  tenantId?: string;
  startDate?: string;
  endDate?: string;
  signedDate?: string;
  pdfUrl?: string;
  note?: string | null;
  signatorySameAsTenant?: boolean;
  signatoryName?: string;
  signatoryIdNumber?: string;
  signatoryPhone?: string;
  billing?: {
    actualRent: string;
    rentDueDay: number;
    paymentMethodId: string;
    bankAccountId?: string | null;
    depositAmount?: string | null;
    depositReceivedDate?: string | null;
    waterUnitPrice?: string | null;
    electricityUnitPrice?: string | null;
    managementFee?: string | null;
  };
  equipment?: EquipmentInitial[];
};

type Props = {
  mode: "create" | "edit";
  properties: PropertyOption[];
  units: UnitOption[];
  tenants: TenantOption[];
  paymentMethods: PaymentMethodOption[];
  bankAccounts: BankAccountOption[];
  equipmentTypes: EquipmentTypeOption[];
  initial?: ContractFormInitial;
  submitLabel: string;
  onSubmit: (fd: FormData) => Promise<{ error?: string; ok?: true; id?: string }>;
  /** 即時檢查時間區段衝突；填齊房間與起訖日後自動呼叫 */
  checkConflictAction: (
    unitId: string,
    startDate: string,
    endDate: string,
    excludeContractId?: string
  ) => Promise<{ conflict: boolean; message?: string }>;
  /** 編輯模式時排除自身（避免「自己跟自己重疊」誤報） */
  excludeContractId?: string;
  nextPath?: string;
};

/** 將起始日加上 N 個月，回傳 YYYY-MM-DD 字串。月底自動 clamp 至當月最後一天。 */
function addMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return "";
  const target = new Date(y, m - 1 + months, d);
  // 月底 clamp：例如 1/31 + 1 月，瀏覽器會自動跳到 3/2，要修正
  if (target.getDate() !== d) target.setDate(0);
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, "0");
  const dd = String(target.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ContractForm({
  mode,
  properties,
  units,
  tenants,
  paymentMethods,
  bankAccounts,
  equipmentTypes,
  initial = {},
  submitLabel,
  onSubmit,
  checkConflictAction,
  excludeContractId,
  nextPath,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();

  // 初始 propertyId：若 initial.unitId 存在則回查所屬 property
  const initialPropertyId =
    initial.unitId ? units.find((u) => u.id === initial.unitId)?.propertyId ?? "" : "";

  // 房產 / 房間 / 房客 受控（房產 → 房間 連動；簽約人同房客）
  const [propertyId, setPropertyId] = useState(initialPropertyId);
  const [unitId, setUnitId] = useState(initial.unitId ?? "");
  const [tenantId, setTenantId] = useState(initial.tenantId ?? "");
  const [actualRent, setActualRent] = useState(initial.billing?.actualRent ?? "");

  // 依房產過濾房間
  const filteredUnits = propertyId ? units.filter((u) => u.propertyId === propertyId) : [];

  // 判斷目前選定的房產是否為「整棟型」（隱藏房間欄位、自動帶入隱形 Unit）
  const selectedProperty = propertyId ? properties.find((p) => p.id === propertyId) : null;
  const isWholeBuilding = selectedProperty?.kind === "WHOLE_BUILDING";

  // 整棟型：選了房產後自動帶入該房產唯一的隱形 Unit
  useEffect(() => {
    if (isWholeBuilding && filteredUnits.length > 0 && unitId !== filteredUnits[0].id) {
      setUnitId(filteredUnits[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWholeBuilding, propertyId]);

  // 起訖日受控（編輯時可用快速按鈕計算結束日）
  const [startDate, setStartDate] = useState(initial.startDate ?? "");
  const [endDate, setEndDate] = useState(initial.endDate ?? "");

  // 即時重疊檢查
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // 條件不齊備就清除提示
    if (!unitId || !startDate || !endDate) {
      setConflictMsg(null);
      return;
    }
    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await checkConflictAction(unitId, startDate, endDate, excludeContractId);
        setConflictMsg(res.conflict ? res.message ?? "此房間在所選期間內已有有效合約" : null);
      } catch {
        // 檢查失敗不擋使用者，僅清除提示（送出時 server 仍會再驗）
        setConflictMsg(null);
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [unitId, startDate, endDate, excludeContractId, checkConflictAction]);

  // 簽約人「同房客資料」
  const [sameAsTenant, setSameAsTenant] = useState(
    initial.signatorySameAsTenant ?? true
  );

  // 設備清單動態陣列
  const [equipRows, setEquipRows] = useState<EquipmentInitial[]>(
    initial.equipment && initial.equipment.length > 0
      ? initial.equipment
      : []
  );

  // 房間變動 → 抓 baseRent 預設帶入（create 模式或實際租金尚未自訂時）
  const selectedUnit = units.find((u) => u.id === unitId);
  useEffect(() => {
    if (mode === "create" && selectedUnit && !actualRent) {
      setActualRent(selectedUnit.baseRent);
    }
    // 故意只在房間切換時觸發；不要把 actualRent 加進依賴
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId]);

  function resetActualRent() {
    if (selectedUnit) setActualRent(selectedUnit.baseRent);
  }

  // 同房客資料：勾選時自動帶入並讓 input 變唯讀
  const selectedTenant = tenants.find((t) => t.id === tenantId);
  const signatoryName = sameAsTenant ? selectedTenant?.name ?? "" : undefined;
  const signatoryIdNumber = sameAsTenant ? selectedTenant?.idNumber ?? "" : undefined;
  const signatoryPhone = sameAsTenant ? selectedTenant?.phone ?? "" : undefined;

  // 設備清單操作
  function addEquipRow() {
    setEquipRows((rows) => [
      ...rows,
      { equipmentTypeId: equipmentTypes[0]?.id ?? "", quantity: 1, condition: "GOOD", note: null },
    ]);
  }
  function removeEquipRow(idx: number) {
    setEquipRows((rows) => rows.filter((_, i) => i !== idx));
  }
  function updateEquipRow<K extends keyof EquipmentInitial>(idx: number, key: K, value: EquipmentInitial[K]) {
    setEquipRows((rows) => rows.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await onSubmit(fd);
      if (res?.error) { setError(res.error); return; }
      const target = res?.id ? `/contracts/${res.id}` : nextPath ?? "/contracts";
      router.push(target);
      router.refresh();
    });
  }

  const lockedSubject = mode === "edit"; // 編輯時房間/房客 disabled

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── 區塊 1：基本資料 ── */}
      <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="text-lg font-medium text-on-surface">基本資料</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="關聯房產" htmlFor="propertyId" required>
            <Select
              id="propertyId"
              value={propertyId}
              onChange={(e) => {
                setPropertyId(e.target.value);
                setUnitId(""); // 切房產時清空房間
              }}
              disabled={lockedSubject}
              required={!lockedSubject}
              options={[
                { value: "", label: "— 請選擇 —" },
                ...properties.map((p) => ({
                  value: p.id,
                  label: `${p.kind === "WHOLE_BUILDING" ? "🏪" : "🏢"} ${p.name}`,
                })),
              ]}
            />
          </FormField>

          {/* 整棟型房產：不顯示關聯房間欄位，但仍以 hidden input 送出 unitId */}
          {isWholeBuilding ? (
            <>
              <input type="hidden" name="unitId" value={unitId} />
              <div className="rounded-lg bg-status-completed/8 px-4 py-3 text-sm text-status-completed self-end">
                🏪 整棟型房產，整棟即合約主體
              </div>
            </>
          ) : (
            <FormField
              label="關聯房間"
              htmlFor="unitId"
              required
              helper={!propertyId ? "請先選擇關聯房產" : undefined}
            >
              <Select
                id="unitId"
                // disabled 的 select 不會把值送出，編輯模式改用下方 hidden input 帶值
                name={lockedSubject ? undefined : "unitId"}
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                disabled={lockedSubject || !propertyId}
                required={!lockedSubject}
                options={[
                  { value: "", label: propertyId ? "— 請選擇 —" : "— 請先選房產 —" },
                  ...filteredUnits.map((u) => ({ value: u.id, label: u.number })),
                ]}
              />
              {lockedSubject && <input type="hidden" name="unitId" value={unitId} />}
            </FormField>
          )}
          <FormField label="關聯房客" htmlFor="tenantId" required>
            <Select
              id="tenantId"
              name={lockedSubject ? undefined : "tenantId"}
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              disabled={lockedSubject}
              required={!lockedSubject}
              options={[
                { value: "", label: "— 請選擇 —" },
                ...tenants.map((t) => ({ value: t.id, label: `${t.name}（${t.phone}）` })),
              ]}
            />
            {lockedSubject && <input type="hidden" name="tenantId" value={tenantId} />}
          </FormField>
          <FormField label="合約開始日" htmlFor="startDate" required>
            <TextInput
              id="startDate"
              name="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </FormField>
          <FormField label="合約結束日" htmlFor="endDate" required helper="可使用下方按鈕快速套用">
            <TextInput
              id="endDate"
              name="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
            <div className="mt-2 flex gap-2">
              {[
                { label: "半年", months: 6 },
                { label: "一年", months: 12 },
                { label: "兩年", months: 24 },
              ].map((preset) => (
                <button
                  key={preset.months}
                  type="button"
                  onClick={() => startDate && setEndDate(addMonths(startDate, preset.months))}
                  disabled={!startDate}
                  className="rounded-full bg-secondary-container px-3 py-1 text-xs font-medium text-on-secondary-container hover:bg-secondary-container/80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  + {preset.label}
                </button>
              ))}
            </div>
          </FormField>

          {/* 即時衝突提示（跨兩欄） */}
          {(conflictMsg || checking) && (
            <div className="md:col-span-2">
              {checking && !conflictMsg ? (
                <p className="text-xs text-on-surface-variant">檢查重疊中…</p>
              ) : conflictMsg ? (
                <div className="flex items-start gap-2 rounded-lg bg-status-overdue/12 px-4 py-2.5 text-sm text-status-overdue">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 flex-shrink-0">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-1-9a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 10 5Z" clipRule="evenodd" />
                  </svg>
                  <span>{conflictMsg}</span>
                </div>
              ) : null}
            </div>
          )}

          <FormField label="簽約日期" htmlFor="signedDate" required>
            <TextInput id="signedDate" name="signedDate" type="date" defaultValue={initial.signedDate} required />
          </FormField>
          <FormField label="合約 PDF" htmlFor="pdfUrl" required>
            <FileUpload
              name="pdfUrl"
              prefix="contracts"
              kind="pdf"
              defaultUrl={initial.pdfUrl}
              label="點擊或拖入合約 PDF 掃描檔"
              uploadAction={uploadFileAction}
            />
          </FormField>
        </div>
        <FormField label="備註" htmlFor="note">
          <textarea
            id="note"
            name="note"
            rows={3}
            defaultValue={initial.note ?? ""}
            placeholder="選填"
            className="block w-full rounded-lg border-0 bg-surface px-4 py-3 text-on-surface ring-1 ring-inset ring-outline placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          />
        </FormField>
      </section>

      {/* ── 區塊 2：簽約人資料 ── */}
      <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-on-surface">簽約人資料</h2>
          <label className="inline-flex items-center gap-2 text-sm text-on-surface">
            <input
              type="checkbox"
              name="signatorySameAsTenant"
              checked={sameAsTenant}
              onChange={(e) => setSameAsTenant(e.target.checked)}
              className="h-4 w-4 rounded border-outline accent-primary"
            />
            同房客資料
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="姓名" htmlFor="signatoryName" required>
            <TextInput
              id="signatoryName"
              name="signatoryName"
              value={sameAsTenant ? signatoryName : undefined}
              defaultValue={sameAsTenant ? undefined : initial.signatoryName}
              readOnly={sameAsTenant}
              required
            />
          </FormField>
          <FormField label="身分證字號" htmlFor="signatoryIdNumber" required>
            <TextInput
              id="signatoryIdNumber"
              name="signatoryIdNumber"
              value={sameAsTenant ? signatoryIdNumber : undefined}
              defaultValue={sameAsTenant ? undefined : initial.signatoryIdNumber}
              readOnly={sameAsTenant}
              className="uppercase"
              required
            />
          </FormField>
          <FormField label="聯絡電話" htmlFor="signatoryPhone" required>
            <TextInput
              id="signatoryPhone"
              name="signatoryPhone"
              value={sameAsTenant ? signatoryPhone : undefined}
              defaultValue={sameAsTenant ? undefined : initial.signatoryPhone}
              readOnly={sameAsTenant}
              required
            />
          </FormField>
        </div>
        {sameAsTenant && !selectedTenant && (
          <p className="text-xs text-on-surface-variant">請先在上方選擇房客，欄位將自動帶入。</p>
        )}
      </section>

      {/* ── 區塊 3：租金條件 ── */}
      <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <h2 className="text-lg font-medium text-on-surface">租金條件</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="實際租金（每月）" htmlFor="actualRent" required helper={selectedUnit ? `基本租金：${selectedUnit.baseRent}` : undefined}>
            <div className="flex gap-2">
              <TextInput
                id="actualRent"
                name="actualRent"
                type="number"
                min="0"
                step="1"
                value={actualRent}
                onChange={(e) => setActualRent(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={resetActualRent}
                disabled={!selectedUnit}
                className="whitespace-nowrap rounded-lg bg-secondary-container px-3 text-sm text-on-secondary-container hover:bg-secondary-container/80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                回復預設
              </button>
            </div>
          </FormField>
          <FormField label="收租日" htmlFor="rentDueDay" required helper="每月幾號（1–31）">
            <TextInput
              id="rentDueDay"
              name="rentDueDay"
              type="number"
              min="1"
              max="31"
              step="1"
              defaultValue={initial.billing?.rentDueDay ?? 1}
              required
            />
          </FormField>
          <FormField label="收款方式" htmlFor="paymentMethodId" required>
            <Select
              id="paymentMethodId"
              name="paymentMethodId"
              defaultValue={initial.billing?.paymentMethodId ?? ""}
              required
              options={[
                { value: "", label: "— 請選擇 —" },
                ...paymentMethods.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </FormField>
          <FormField label="收款銀行帳號" htmlFor="bankAccountId">
            <Select
              id="bankAccountId"
              name="bankAccountId"
              defaultValue={initial.billing?.bankAccountId ?? ""}
              options={[
                { value: "", label: "— 選填 —" },
                ...bankAccounts.map((b) => ({ value: b.id, label: b.label })),
              ]}
            />
          </FormField>
          <FormField label="押金金額" htmlFor="depositAmount">
            <TextInput
              id="depositAmount"
              name="depositAmount"
              type="number"
              min="0"
              step="1"
              defaultValue={initial.billing?.depositAmount ?? ""}
              placeholder="選填"
            />
          </FormField>
          <FormField label="押金收款日" htmlFor="depositReceivedDate">
            <TextInput
              id="depositReceivedDate"
              name="depositReceivedDate"
              type="date"
              defaultValue={initial.billing?.depositReceivedDate ?? ""}
            />
          </FormField>
          <FormField label="水費單價（NT$/度）" htmlFor="waterUnitPrice">
            <TextInput
              id="waterUnitPrice"
              name="waterUnitPrice"
              type="number"
              min="0"
              step="0.01"
              defaultValue={initial.billing?.waterUnitPrice ?? ""}
              placeholder="選填"
            />
          </FormField>
          <FormField label="電費單價（NT$/度）" htmlFor="electricityUnitPrice">
            <TextInput
              id="electricityUnitPrice"
              name="electricityUnitPrice"
              type="number"
              min="0"
              step="0.01"
              defaultValue={initial.billing?.electricityUnitPrice ?? ""}
              placeholder="選填"
            />
          </FormField>
          <FormField label="管理費（每月）" htmlFor="managementFee">
            <TextInput
              id="managementFee"
              name="managementFee"
              type="number"
              min="0"
              step="1"
              defaultValue={initial.billing?.managementFee ?? ""}
              placeholder="選填"
            />
          </FormField>
        </div>
      </section>

      {/* ── 區塊 4：設備清單 ── */}
      <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-on-surface">設備清單</h2>
          <button
            type="button"
            onClick={addEquipRow}
            disabled={equipmentTypes.length === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-secondary-container px-4 text-sm font-medium text-on-secondary-container hover:bg-secondary-container/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + 新增設備
          </button>
        </div>
        {equipmentTypes.length === 0 && (
          <p className="text-sm text-on-surface-variant">
            尚無設備種類資料，請先到「系統設定 → 設備種類管理」新增。
          </p>
        )}
        {equipRows.length === 0 ? (
          <p className="py-4 text-center text-sm text-on-surface-variant">
            尚未加入任何設備
          </p>
        ) : (
          <div className="space-y-3">
            {equipRows.map((row, idx) => (
              <div
                key={idx}
                className="grid gap-3 rounded-xl bg-surface-container p-3 md:grid-cols-[1fr_120px_120px_1fr_auto]"
              >
                <div className="relative">
                  <select
                    name={`equip_typeId_${idx}`}
                    value={row.equipmentTypeId}
                    onChange={(e) => updateEquipRow(idx, "equipmentTypeId", e.target.value)}
                    className="block w-full appearance-none rounded-lg bg-surface pl-3 pr-9 py-2 text-sm ring-1 ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {equipmentTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <SelectChevron />
                </div>
                <input
                  type="number"
                  name={`equip_qty_${idx}`}
                  min="1"
                  step="1"
                  value={row.quantity}
                  onChange={(e) => updateEquipRow(idx, "quantity", Number(e.target.value))}
                  placeholder="數量"
                  className="rounded-lg bg-surface px-3 py-2 text-sm ring-1 ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="relative">
                  <select
                    name={`equip_cond_${idx}`}
                    value={row.condition}
                    onChange={(e) => updateEquipRow(idx, "condition", e.target.value as EquipmentCondition)}
                    className="block w-full appearance-none rounded-lg bg-surface pl-3 pr-9 py-2 text-sm ring-1 ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="GOOD">良好</option>
                    <option value="FAIR">普通</option>
                    <option value="DAMAGED">損壞</option>
                  </select>
                  <SelectChevron />
                </div>
                <input
                  type="text"
                  name={`equip_note_${idx}`}
                  value={row.note ?? ""}
                  onChange={(e) => updateEquipRow(idx, "note", e.target.value)}
                  placeholder="備註（選填）"
                  className="rounded-lg bg-surface px-3 py-2 text-sm ring-1 ring-outline focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => removeEquipRow(idx)}
                  className="rounded-lg px-3 text-sm text-error hover:bg-error/8"
                  aria-label="刪除此設備"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button variant="outlined" type="button" onClick={() => router.back()}>取消</Button>
        <Button variant="filled" type="submit" disabled={isPending || !!conflictMsg}>
          {isPending ? "儲存中…" : conflictMsg ? "請先解決衝突" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
