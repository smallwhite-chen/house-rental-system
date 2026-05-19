"use client";
import { useRef, useState, useTransition } from "react";

const MAX_SIZE = 5 * 1024 * 1024;
const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  /** 隱藏 input 的 name；server 端用 fd.getAll(name) 取出 string[] */
  name: string;
  /** Storage 路徑前綴：properties / units / equipment / ... */
  prefix: string;
  /** 上限張數（SPEC：房間 10、設備 5、房產不限） */
  max?: number;
  /** 編輯模式初始 URLs */
  defaultUrls?: string[];
  /** 上傳 server action（同 FileUpload） */
  uploadAction: (
    prefix: string,
    kind: "image" | "pdf",
    fd: FormData
  ) => Promise<{ url?: string; error?: string }>;
  /** 對外通知 URL 變動 */
  onChange?: (urls: string[]) => void;
};

/**
 * 多圖陣列上傳元件。
 *
 * 設計：
 * - 縮圖網格（5 欄 sm:6 lg:8）
 * - 點 + 按鈕或拖入多張 → 並行上傳
 * - 每張縮圖 hover 顯示 ✕ 刪除
 * - 達上限後 + 按鈕消失
 * - URLs 以多個同名 hidden input 帶入 FormData，server fd.getAll() 即可
 *
 * 不支援拖曳重排（未來再加）。
 */
export function MultiImageUpload({
  name,
  prefix,
  max,
  defaultUrls = [],
  uploadAction,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<string[]>(defaultUrls);
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();
  const [dragging, setDragging] = useState(false);

  const atLimit = max != null && urls.length >= max;
  const remaining = max != null ? max - urls.length : Infinity;

  function update(next: string[]) {
    setUrls(next);
    onChange?.(next);
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");

    // 取最多剩下可上傳張數
    const toUpload = Array.from(files).slice(0, remaining);
    if (files.length > toUpload.length) {
      setError(`一次最多再上傳 ${toUpload.length} 張（剩餘額度）`);
    }

    // Client 端先驗證每張
    const valid: File[] = [];
    for (const f of toUpload) {
      if (!IMAGE_MIME.includes(f.type)) {
        setError(`「${f.name}」格式不支援（需 JPG/PNG/WebP）`);
        continue;
      }
      if (f.size > MAX_SIZE) {
        setError(`「${f.name}」太大（上限 5 MB）`);
        continue;
      }
      valid.push(f);
    }

    if (valid.length === 0) return;

    start(async () => {
      // 並行上傳全部 valid 檔案
      const results = await Promise.all(
        valid.map(async (file) => {
          const fd = new FormData();
          fd.append("file", file);
          return uploadAction(prefix, "image", fd);
        })
      );

      const newUrls: string[] = [];
      const failed: string[] = [];
      results.forEach((res, i) => {
        if (res.url) newUrls.push(res.url);
        else failed.push(`${valid[i].name}：${res.error ?? "上傳失敗"}`);
      });

      if (newUrls.length > 0) update([...urls, ...newUrls]);
      if (failed.length > 0) setError(failed.join("；"));
    });
  }

  function handleRemove(index: number) {
    setError("");
    update(urls.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div>
      {/* 多個同名 hidden input：server 端 fd.getAll(name) 取得 string[] */}
      {urls.map((url, i) => (
        <input key={i} type="hidden" name={name} value={url} />
      ))}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div
        onDragOver={(e) => { e.preventDefault(); if (!atLimit) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { if (!atLimit) handleDrop(e); }}
        className={`grid grid-cols-3 gap-3 rounded-xl bg-surface-container/30 p-3 ring-1 ring-outline-variant sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 ${
          dragging ? "ring-2 ring-primary" : ""
        }`}
      >
        {urls.map((url, i) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-outline-variant"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`圖片 ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              aria-label="移除"
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-error group-hover:opacity-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        ))}

        {!atLimit && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-outline text-on-surface-variant transition-colors hover:border-primary hover:bg-primary/4 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <span className="text-xs">上傳中…</span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
                <span className="text-xs">新增</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="mt-2 flex justify-between text-xs text-on-surface-variant">
        <span>
          {urls.length} 張{max != null ? ` / 上限 ${max} 張` : ""}
        </span>
        <span>JPG / PNG / WebP · 單張最大 5 MB</span>
      </div>

      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
}
