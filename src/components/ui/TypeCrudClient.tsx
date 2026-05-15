"use client";
import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { FormField } from "@/components/ui/FormField";

export type TypeItem = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
};

type Props = {
  moduleName: string;
  items: TypeItem[];
  backHref?: string;
  createAction: (fd: FormData) => Promise<{ error?: string }>;
  updateAction: (id: string, fd: FormData) => Promise<{ error?: string }>;
  deleteAction: (id: string) => Promise<{ error?: string }>;
};

export function TypeCrudClient({
  moduleName,
  items,
  backHref = "/settings",
  createAction,
  updateAction,
  deleteAction,
}: Props) {
  const [dialog, setDialog] = useState<
    | { mode: "create" }
    | { mode: "edit"; item: TypeItem }
    | { mode: "delete"; item: TypeItem }
    | null
  >(null);
  const [serverError, setServerError] = useState("");
  const [isPending, startTransition] = useTransition();

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
            <li>
              <a href={backHref} className="hover:text-on-surface hover:underline">
                系統設定
              </a>
            </li>
            <li aria-hidden="true">›</li>
            <li className="text-on-surface">{moduleName}管理</li>
          </ol>
        </nav>

        <header className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-medium text-on-surface">{moduleName}管理</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              共 {items.length} 個{moduleName}
            </p>
          </div>
          <Button
            variant="filled"
            leadingIcon={<PlusIcon />}
            onClick={() => { setServerError(""); setDialog({ mode: "create" }); }}
          >
            新增{moduleName}
          </Button>
        </header>

        <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-outline-variant">
          {items.length === 0 ? (
            <div className="py-16 text-center text-sm text-on-surface-variant">
              尚無{moduleName}，請點擊右上角「新增」建立第一個。
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-surface-container-high text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                <tr>
                  <th className="px-6 py-3">名稱</th>
                  <th className="px-6 py-3">說明</th>
                  <th className="px-6 py-3 whitespace-nowrap">建立時間</th>
                  <th className="px-6 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
                {items.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-surface-container">
                    <td className="px-6 py-4 font-medium">{item.name}</td>
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
        <Modal title={`新增${moduleName}`} onClose={closeDialog}>
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <FormField label="名稱" htmlFor="name" required>
              <TextInput id="name" name="name" placeholder={`請輸入${moduleName}名稱`} required autoFocus />
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
        <Modal title={`編輯${moduleName}`} onClose={closeDialog}>
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
            若此種類已被使用中，將無法刪除。
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
