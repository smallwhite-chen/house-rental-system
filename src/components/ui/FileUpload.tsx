"use client";
import { useRef, useState, useTransition } from "react";

type Kind = "image" | "pdf";

/** 5 MB 上限（SPEC 規定）。Client 端先驗，避免 Next.js bodySizeLimit 觸發 413。 */
const MAX_SIZE = 5 * 1024 * 1024;
const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"];
const PDF_MIME = ["application/pdf"];

type Props = {
  /** 隱藏 input 對應的 name；表單送出時帶入此名 URL */
  name: string;
  /** 上傳路徑前綴（例：tenants / contracts / expenses） */
  prefix: string;
  /** 允許的檔案類型 */
  kind: Kind;
  /** 表單初始 URL（編輯模式） */
  defaultUrl?: string | null;
  /** 標籤文字（顯示在按鈕上） */
  label?: string;
  /** 上傳 server action（從外面注入避免 client 直接 import server-only lib） */
  uploadAction: (
    prefix: string,
    kind: Kind,
    fd: FormData
  ) => Promise<{ url?: string; error?: string }>;
  /** 表單送出後若使用者刪除上傳，把 hidden input 值清空 */
  onChange?: (url: string | null) => void;
};

/**
 * 通用單檔上傳元件。
 *
 * 流程：
 *  1. 使用者點按鈕或拖入檔案
 *  2. 立即呼叫 uploadAction，上傳到 Supabase Storage
 *  3. 取得 URL 後寫入 hidden input（form 送出時帶入）
 *  4. 顯示「已上傳」+ 預覽（圖片直接 <img>；PDF 顯示連結）
 *  5. 使用者可點「移除」清空（注意：不會刪 Storage 內檔，留 orphan）
 *
 * 拖放：整個區塊都接受 dragover/drop。
 */
export function FileUpload({
  name,
  prefix,
  kind,
  defaultUrl,
  label,
  uploadAction,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(defaultUrl ?? null);
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    setError("");

    // ─── Client 端先驗證，避免送到 Server Action 才失敗 ───

    // 型別檢查
    const allowed = kind === "pdf" ? PDF_MIME : IMAGE_MIME;
    if (!allowed.includes(file.type)) {
      const hint = kind === "pdf" ? "請選擇 PDF 檔案" : "請選擇 JPG / PNG / WebP 圖片";
      setError(`不支援的檔案格式（${file.type || "未知"}）。${hint}`);
      return;
    }

    // 大小檢查（5 MB）
    if (file.size > MAX_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      setError(`檔案太大（${sizeMB} MB）。上限為 5 MB，請壓縮後重試`);
      return;
    }

    // ─── 通過檢查後才呼叫 Server Action ───
    const fd = new FormData();
    fd.append("file", file);
    start(async () => {
      try {
        const res = await uploadAction(prefix, kind, fd);
        if (res.error || !res.url) {
          setError(res.error ?? "上傳失敗");
          return;
        }
        setUrl(res.url);
        onChange?.(res.url);
      } catch (e) {
        // 防呆：Server Action 拋出未預期錯誤（例如 body limit 仍然被觸發）
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("Body exceeded") || msg.includes("413")) {
          setError("檔案太大，伺服器拒絕了。請壓縮後重試");
        } else {
          setError("上傳失敗，請稍後再試");
        }
        console.error("[FileUpload]", e);
      }
    });
  }

  function handleRemove() {
    setError("");
    setUrl(null);
    onChange?.(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const accept = kind === "pdf" ? "application/pdf" : "image/jpeg,image/png,image/webp";
  const hint = kind === "pdf" ? "PDF · 最大 5 MB" : "JPG / PNG / WebP · 最大 5 MB";

  return (
    <div>
      <input type="hidden" name={name} value={url ?? ""} />
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {url ? (
        <UploadedPreview url={url} kind={kind} onRemove={handleRemove} />
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 transition-colors ${
            dragging
              ? "border-primary bg-primary/8"
              : "border-outline bg-surface-container/40 hover:border-primary hover:bg-primary/4"
          }`}
        >
          <UploadIcon className="h-6 w-6 text-on-surface-variant" />
          <p className="text-sm text-on-surface">
            {isPending ? "上傳中…" : label ?? "點擊或拖入檔案"}
          </p>
          <p className="text-xs text-on-surface-variant">{hint}</p>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}

function UploadedPreview({
  url,
  kind,
  onRemove,
}: {
  url: string;
  kind: Kind;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-container p-3 ring-1 ring-outline-variant">
      {kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="已上傳的圖片"
          className="h-16 w-16 rounded-md object-cover ring-1 ring-outline-variant"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-md bg-primary-container text-on-primary-container">
          <PdfIcon />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-on-surface">
          {kind === "pdf" ? "PDF 已上傳" : "圖片已上傳"}
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline truncate block"
        >
          開啟檔案 ↗
        </a>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full px-3 py-1 text-sm text-error hover:bg-error/8"
      >
        移除
      </button>
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M11.47 1.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1-1.06 1.06l-1.72-1.72V13.5a.75.75 0 0 1-1.5 0V4.06L9.53 5.78a.75.75 0 0 1-1.06-1.06l3-3ZM11.25 13.5V4.06l-1.72 1.72a.75.75 0 0 1-1.06-1.06l3-3a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1-1.06 1.06L12.75 4.06V13.5a.75.75 0 0 1-1.5 0Z" />
      <path d="M4.5 14.25a.75.75 0 0 1 .75.75v3.75c0 .414.336.75.75.75h12a.75.75 0 0 0 .75-.75V15a.75.75 0 0 1 1.5 0v3.75A2.25 2.25 0 0 1 18 21H6a2.25 2.25 0 0 1-2.25-2.25V15a.75.75 0 0 1 .75-.75Z" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden="true">
      <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" clipRule="evenodd" />
      <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
    </svg>
  );
}
