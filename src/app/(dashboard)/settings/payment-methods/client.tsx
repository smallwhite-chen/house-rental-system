"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { FormField } from "@/components/ui/FormField";

type BankAccount = {
  id: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  accountHolder: string;
  note: string | null;
  createdAt: Date;
};

type PaymentCategory = {
  id: string;
  name: string;
  note: string | null;
  createdAt: Date;
};

type Props = {
  bankAccounts: BankAccount[];
  paymentCategories: PaymentCategory[];
  createBankAccount: (fd: FormData) => Promise<{ error?: string }>;
  updateBankAccount: (id: string, fd: FormData) => Promise<{ error?: string }>;
  deleteBankAccount: (id: string) => Promise<{ error?: string }>;
  createPaymentCategory: (fd: FormData) => Promise<{ error?: string }>;
  updatePaymentCategory: (id: string, fd: FormData) => Promise<{ error?: string }>;
  deletePaymentCategory: (id: string) => Promise<{ error?: string }>;
};

type BankDialog =
  | { mode: "create" }
  | { mode: "edit"; item: BankAccount }
  | { mode: "delete"; item: BankAccount }
  | null;

type CategoryDialog =
  | { mode: "create" }
  | { mode: "edit"; item: PaymentCategory }
  | { mode: "delete"; item: PaymentCategory }
  | null;

export function PaymentMethodsClient({
  bankAccounts, paymentCategories,
  createBankAccount, updateBankAccount, deleteBankAccount,
  createPaymentCategory, updatePaymentCategory, deletePaymentCategory,
}: Props) {
  const [bankDialog, setBankDialog] = useState<BankDialog>(null);
  const [catDialog, setCatDialog] = useState<CategoryDialog>(null);
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();

  function closeAll() { setBankDialog(null); setCatDialog(null); setError(""); }

  function submit(fn: () => Promise<{ error?: string }>) {
    start(async () => {
      const res = await fn();
      if (res?.error) { setError(res.error); return; }
      closeAll();
    });
  }

  function handleBankSubmit(e: React.FormEvent<HTMLFormElement>, isEdit: boolean) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (isEdit && bankDialog?.mode === "edit") {
      submit(() => updateBankAccount(bankDialog.item.id, fd));
    } else {
      submit(() => createBankAccount(fd));
    }
  }

  function handleCatSubmit(e: React.FormEvent<HTMLFormElement>, isEdit: boolean) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (isEdit && catDialog?.mode === "edit") {
      submit(() => updatePaymentCategory(catDialog.item.id, fd));
    } else {
      submit(() => createPaymentCategory(fd));
    }
  }

  return (
    <>
      <div className="space-y-8">
        {/* ── Section 1: Bank Accounts ── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium text-on-surface">銀行帳號</h2>
              <p className="text-sm text-on-surface-variant">供合約指定匯款用的帳號資訊</p>
            </div>
            <Button variant="filled" leadingIcon={<PlusIcon />} onClick={() => { setError(""); setBankDialog({ mode: "create" }); }}>
              新增帳號
            </Button>
          </div>
          <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-outline-variant">
            {bankAccounts.length === 0 ? (
              <div className="py-12 text-center text-sm text-on-surface-variant">尚無銀行帳號</div>
            ) : (
              <table className="w-full">
                <thead className="bg-surface-container-high text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-3">銀行 / 分行</th>
                    <th className="px-6 py-3">帳號</th>
                    <th className="px-6 py-3">戶名</th>
                    <th className="px-6 py-3">備註</th>
                    <th className="px-6 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
                  {bankAccounts.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-container">
                      <td className="px-6 py-4">
                        <div className="font-medium">{b.bankName}</div>
                        <div className="text-xs text-on-surface-variant">{b.branchName}</div>
                      </td>
                      <td className="px-6 py-4 font-mono">{b.accountNumber}</td>
                      <td className="px-6 py-4">{b.accountHolder}</td>
                      <td className="px-6 py-4 text-on-surface-variant">{b.note ?? <span className="text-outline">—</span>}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button className="rounded-full px-3 py-1 text-sm text-primary hover:bg-primary/8" onClick={() => { setError(""); setBankDialog({ mode: "edit", item: b }); }}>編輯</button>
                        <button className="ml-1 rounded-full px-3 py-1 text-sm text-error hover:bg-error/8" onClick={() => { setError(""); setBankDialog({ mode: "delete", item: b }); }}>刪除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* ── Section 2: Payment Categories ── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium text-on-surface">收款方式種類</h2>
              <p className="text-sm text-on-surface-variant">例如：現金、匯款、信用卡</p>
            </div>
            <Button variant="filled" leadingIcon={<PlusIcon />} onClick={() => { setError(""); setCatDialog({ mode: "create" }); }}>
              新增種類
            </Button>
          </div>
          <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-outline-variant">
            {paymentCategories.length === 0 ? (
              <div className="py-12 text-center text-sm text-on-surface-variant">尚無收款方式種類</div>
            ) : (
              <table className="w-full">
                <thead className="bg-surface-container-high text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-3">名稱</th>
                    <th className="px-6 py-3">備註</th>
                    <th className="px-6 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
                  {paymentCategories.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-container">
                      <td className="px-6 py-4 font-medium">{c.name}</td>
                      <td className="px-6 py-4 text-on-surface-variant">{c.note ?? <span className="text-outline">—</span>}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button className="rounded-full px-3 py-1 text-sm text-primary hover:bg-primary/8" onClick={() => { setError(""); setCatDialog({ mode: "edit", item: c }); }}>編輯</button>
                        <button className="ml-1 rounded-full px-3 py-1 text-sm text-error hover:bg-error/8" onClick={() => { setError(""); setCatDialog({ mode: "delete", item: c }); }}>刪除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {/* ── Bank Account Dialogs ── */}
      {(bankDialog?.mode === "create" || bankDialog?.mode === "edit") && (
        <Modal title={bankDialog.mode === "create" ? "新增銀行帳號" : "編輯銀行帳號"} onClose={closeAll}>
          <form onSubmit={(e) => handleBankSubmit(e, bankDialog.mode === "edit")} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="銀行名稱" htmlFor="bankName" required>
                <TextInput id="bankName" name="bankName" defaultValue={bankDialog.mode === "edit" ? bankDialog.item.bankName : ""} required autoFocus />
              </FormField>
              <FormField label="分行名稱" htmlFor="branchName" required>
                <TextInput id="branchName" name="branchName" defaultValue={bankDialog.mode === "edit" ? bankDialog.item.branchName : ""} required />
              </FormField>
            </div>
            <FormField label="帳號" htmlFor="accountNumber" required>
              <TextInput id="accountNumber" name="accountNumber" defaultValue={bankDialog.mode === "edit" ? bankDialog.item.accountNumber : ""} required />
            </FormField>
            <FormField label="戶名" htmlFor="accountHolder" required>
              <TextInput id="accountHolder" name="accountHolder" defaultValue={bankDialog.mode === "edit" ? bankDialog.item.accountHolder : ""} required />
            </FormField>
            <FormField label="備註" htmlFor="note">
              <TextInput id="note" name="note" defaultValue={bankDialog.mode === "edit" ? (bankDialog.item.note ?? "") : ""} placeholder="選填" />
            </FormField>
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outlined" onClick={closeAll} type="button">取消</Button>
              <Button variant="filled" type="submit" disabled={isPending}>{isPending ? "儲存中…" : bankDialog.mode === "create" ? "新增" : "儲存"}</Button>
            </div>
          </form>
        </Modal>
      )}
      {bankDialog?.mode === "delete" && (
        <Modal title="確認刪除銀行帳號" onClose={closeAll}>
          <p className="text-sm text-on-surface-variant">確定要刪除 <strong className="text-on-surface">「{bankDialog.item.bankName} {bankDialog.item.accountNumber}」</strong> 嗎？若此帳號已被合約使用，將無法刪除。</p>
          {error && <p className="mt-3 text-sm text-error">{error}</p>}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outlined" onClick={closeAll} type="button">取消</Button>
            <Button variant="danger" onClick={() => submit(() => deleteBankAccount(bankDialog.item.id))} disabled={isPending}>{isPending ? "刪除中…" : "確認刪除"}</Button>
          </div>
        </Modal>
      )}

      {/* ── Payment Category Dialogs ── */}
      {(catDialog?.mode === "create" || catDialog?.mode === "edit") && (
        <Modal title={catDialog.mode === "create" ? "新增收款方式種類" : "編輯收款方式種類"} onClose={closeAll}>
          <form onSubmit={(e) => handleCatSubmit(e, catDialog.mode === "edit")} className="space-y-4">
            <FormField label="種類名稱" htmlFor="catName" required>
              <TextInput id="catName" name="name" defaultValue={catDialog.mode === "edit" ? catDialog.item.name : ""} required autoFocus />
            </FormField>
            <FormField label="備註" htmlFor="catNote">
              <TextInput id="catNote" name="note" defaultValue={catDialog.mode === "edit" ? (catDialog.item.note ?? "") : ""} placeholder="選填" />
            </FormField>
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outlined" onClick={closeAll} type="button">取消</Button>
              <Button variant="filled" type="submit" disabled={isPending}>{isPending ? "儲存中…" : catDialog.mode === "create" ? "新增" : "儲存"}</Button>
            </div>
          </form>
        </Modal>
      )}
      {catDialog?.mode === "delete" && (
        <Modal title="確認刪除" onClose={closeAll}>
          <p className="text-sm text-on-surface-variant">確定要刪除 <strong className="text-on-surface">「{catDialog.item.name}」</strong> 嗎？若此種類已被使用中，將無法刪除。</p>
          {error && <p className="mt-3 text-sm text-error">{error}</p>}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outlined" onClick={closeAll} type="button">取消</Button>
            <Button variant="danger" onClick={() => submit(() => deletePaymentCategory(catDialog.item.id))} disabled={isPending}>{isPending ? "刪除中…" : "確認刪除"}</Button>
          </div>
        </Modal>
      )}
    </>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-3xl bg-surface p-6 shadow-xl ring-1 ring-outline-variant">
        <h2 className="mb-4 text-xl font-medium text-on-surface">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
    </svg>
  );
}
