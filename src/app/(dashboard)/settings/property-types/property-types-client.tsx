"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { FormField } from "@/components/ui/FormField";
import { SelectChevron } from "@/components/ui/Select";
import type { PropertyKind } from "@/generated/prisma/client";

export type PropertyTypeItem = {
  id: string;
  name: string;
  description: string | null;
  kind: PropertyKind | null;
  /** 是否已被房產使用（決定能否變更 kind） */
  inUse: boolean;
  createdAt: Date;
};

type Props = {
  items: PropertyTypeItem[];
  createAction: (fd: FormData) => Promise<{ error?: string }>;
  updateAction: (id: string, fd: FormData) => Promise<{ error?: string }>;
  deleteAction: (id: string) => Promise<{ error?: string }>;
};

const KIND_META: Record<PropertyKind, { emoji: string; label: string; tone: string }> = {
  WHOLE_BUILDING: {
    emoji: "🏪",
    label: "整棟型",
    tone: "bg-status-completed/12 text-status-completed",
  },
  MULTI_UNIT: {
    emoji: "🏢",
    label: "多單位型",
    tone: "bg-primary-container text-on-primary-container",
  },
};

export function PropertyTypesClient({
  items,
  createAction,
  updateAction,
  deleteAction,
}: Props) {
  const [dialog, setDialog] = useState<
    | { mode: "create" }
    | { mode: "edit"; item: PropertyTypeItem }
    | { mode: "delete"; item: PropertyTypeItem }
    | null
  >(null);
  const [serverError, setServerError] = useState("");
  const [isPending, startTransition] = useTransition();

  // 有沒有尚未分類（kind=null）的種類 → 顯示提示橫條
  const untaggedCount = items.filter((i) => i.kind === null).length;

  function closeDialog() {
    setDialog(null);
    setServerError("");
  }

  function handleSubmitCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createAction(fd);
      if (res?.error) { setServerError(res.error); return; }
      closeDialog();
    });
  }

  function handleSubmitEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (dialog?.mode !== "edit") return;
    const fd = new FormData(e.currentTarget);
    const id = dialog.item.id;
    startTransition(async () => {
      const res = await updateAction(id, fd);
      if (res?.error) { setServerError(res.error); return; }
      closeDialog();
    });
  }

  function handleDelete() {
    if (dialog?.mode !== "delete") return;
    const id = dialog.item.id;
    startTransition(async () => {
      const res = await deleteAction(id);
      if (res?.error) { setServerError(res.error); return; }
      closeDialog();
    });
  }

  return (
    <>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="text-sm">
          <ol className="flex items-center gap-2 text-on-surface-variant">
            <li><a href="/settings" className="hover:text-on-surface hover:underline">系統設定</a></li>
            <li aria-hidden="true">›</li>
            <li className="text-on-surface">房產種類管理</li>
          </ol>
        </nav>

        <header className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-medium text-on-surface">房產種類管理</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              共 {items.length} 個房產種類
            </p>
          </div>
          <Button
            variant="filled"
            leadingIcon={<PlusIcon />}
            onClick={() => { setServerError(""); setDialog({ mode: "create" }); }}
          >
            新增房產種類
          </Button>
        </header>

        {untaggedCount > 0 && (
          <div className="rounded-2xl bg-status-maintenance/12 px-5 py-3 text-sm text-status-maintenance">
            ⚠ 有 {untaggedCount} 個房產種類尚未指定「適用房產類型」，這些種類不會出現在新增房產的下拉選單中。請點「編輯」補上。
          </div>
        )}

        <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-outline-variant">
          {items.length === 0 ? (
            <div className="py-16 text-center text-sm text-on-surface-variant">
              尚無房產種類，請點擊右上角「新增」建立第一個。
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-surface-container-high text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                <tr>
                  <th className="px-6 py-3">名稱</th>
                  <th className="px-6 py-3">適用房產類型</th>
                  <th className="px-6 py-3">說明</th>
                  <th className="px-6 py-3 whitespace-nowrap">建立時間</th>
                  <th className="px-6 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
                {items.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-surface-container">
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-6 py-4">
                      {item.kind ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${KIND_META[item.kind].tone}`}
                        >
                          {KIND_META[item.kind].emoji} {KIND_META[item.kind].label}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-status-maintenance/12 px-2 py-0.5 text-xs font-medium text-status-maintenance">
                          ⚠ 待設定
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {item.description ?? <span className="text-outline">—</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-on-surface-variant">
                      {item.createdAt.toLocaleDateString("zh-TW")}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        className="rounded-full px-3 py-1 text-sm text-primary hover:bg-primary/8"
                        onClick={() => { setServerError(""); setDialog({ mode: "edit", item }); }}
                      >
                        編輯
                      </button>
                      <button
                        className="ml-1 rounded-full px-3 py-1 text-sm text-error hover:bg-error/8"
                        onClick={() => { setServerError(""); setDialog({ mode: "delete", item }); }}
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      {dialog?.mode === "create" && (
        <Modal title="新增房產種類" onClose={closeDialog}>
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <FormField label="名稱" htmlFor="name" required>
              <TextInput id="name" name="name" placeholder="例：店面、套房大樓" required autoFocus />
            </FormField>
            <FormField
              label="適用房產類型"
              htmlFor="kind"
              required
              helper="決定此種類會在哪一類房產的下拉選單中出現"
            >
              <KindSelect />
            </FormField>
            <FormField label="說明" htmlFor="description">
              <TextInput id="description" name="description" placeholder="選填" />
            </FormField>
            {serverError && <p className="text-sm text-error">{serverError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outlined" onClick={closeDialog} type="button">取消</Button>
              <Button variant="filled" type="submit" disabled={isPending}>
                {isPending ? "儲存中…" : "新增"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Dialog */}
      {dialog?.mode === "edit" && (
        <Modal title="編輯房產種類" onClose={closeDialog}>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <FormField label="名稱" htmlFor="edit-name" required>
              <TextInput
                id="edit-name"
                name="name"
                defaultValue={dialog.item.name}
                required
                autoFocus
              />
            </FormField>
            <FormField
              label="適用房產類型"
              htmlFor="edit-kind"
              required
              helper={dialog.item.inUse ? "此種類已被房產使用，無法變更類型" : undefined}
            >
              <KindSelect
                defaultValue={dialog.item.kind ?? ""}
                disabled={dialog.item.inUse && dialog.item.kind != null}
              />
            </FormField>
            <FormField label="說明" htmlFor="edit-description">
              <TextInput
                id="edit-description"
                name="description"
                defaultValue={dialog.item.description ?? ""}
                placeholder="選填"
              />
            </FormField>
            {serverError && <p className="text-sm text-error">{serverError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outlined" onClick={closeDialog} type="button">取消</Button>
              <Button variant="filled" type="submit" disabled={isPending}>
                {isPending ? "儲存中…" : "儲存"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Dialog */}
      {dialog?.mode === "delete" && (
        <Modal title="確認刪除" onClose={closeDialog}>
          <p className="text-sm text-on-surface-variant">
            確定要刪除 <strong className="text-on-surface">「{dialog.item.name}」</strong> 嗎？
            若此種類已被房產使用，將無法刪除。
          </p>
          {serverError && <p className="mt-3 text-sm text-error">{serverError}</p>}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outlined" onClick={closeDialog} type="button">取消</Button>
            <Button variant="danger" onClick={handleDelete} disabled={isPending}>
              {isPending ? "刪除中…" : "確認刪除"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

function KindSelect({
  defaultValue = "",
  disabled = false,
}: {
  defaultValue?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        id="kind"
        name="kind"
        defaultValue={defaultValue}
        required
        disabled={disabled}
        className="block w-full appearance-none rounded-lg border-0 bg-surface pl-4 pr-10 py-3 text-on-surface ring-1 ring-inset ring-outline focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="" disabled>— 請選擇 —</option>
        <option value="WHOLE_BUILDING">🏪 整棟型（店面、整層、透天）</option>
        <option value="MULTI_UNIT">🏢 多單位型（套房大樓、分租公寓）</option>
      </select>
      <SelectChevron />
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl ring-1 ring-outline-variant">
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
