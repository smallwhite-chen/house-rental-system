/**
 * Supabase Storage 包裝層（伺服端用）。
 *
 * 用法：
 *   import { uploadFile, deleteFile } from "@/lib/supabase-storage";
 *   const { url, path } = await uploadFile(file, "tenants");
 *   await deleteFile(path); // 換新檔時清舊
 *
 * 設計：
 * - 只允許在伺服端呼叫（使用 service_role key）
 * - 每個檔案放在 prefix/{cuid}.ext 路徑下，檔名重複也不會碰撞
 * - 公開 bucket：回傳 publicURL，可直接 <img src> 或 <a href>
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

/**
 * Bucket 名稱來自 env，預設為 "uploads"。
 * 你的 Supabase Dashboard 上建立的 bucket 名稱要與此一致。
 */
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "uploads";

// 延遲建立 client，避免 build 時 env 還沒讀到就崩
function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase Storage 未設定。請於 .env 加上 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY。"
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** 允許的圖片 MIME。 */
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** 允許的合約檔 MIME（PDF）。 */
export const PDF_MIME_TYPES = ["application/pdf"] as const;

/** 5 MB 上限（SPEC 規定）。 */
export const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;

export type UploadResult = {
  /** 公開可訪問的 URL，存到 DB 用此值。 */
  url: string;
  /** Bucket 內路徑，用於後續刪除（可選擇存到 DB 或重新從 URL 解析）。 */
  path: string;
};

/**
 * 上傳檔案到 Supabase Storage。
 *
 * @param file       使用者 form 中的 File
 * @param prefix     路徑前綴，例如 "tenants"、"contracts"、"expenses"
 * @param options    型別與大小驗證限制
 */
export async function uploadFile(
  file: File,
  prefix: string,
  options?: {
    allowedTypes?: readonly string[];
    maxSize?: number;
  }
): Promise<UploadResult> {
  const allowedTypes = options?.allowedTypes;
  const maxSize = options?.maxSize ?? DEFAULT_MAX_SIZE;

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    throw new Error(
      `不支援的檔案格式（${file.type}）。允許：${allowedTypes.join(", ")}`
    );
  }
  if (file.size > maxSize) {
    const sizeMB = (maxSize / 1024 / 1024).toFixed(1);
    throw new Error(`檔案過大（最多 ${sizeMB} MB）`);
  }

  // 產生不會碰撞的檔名
  const ext = extOf(file.name) || extOfMime(file.type) || "bin";
  const id = randomBytes(8).toString("hex");
  const path = `${prefix}/${id}.${ext}`;

  const supabase = getClient();
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, Buffer.from(arrayBuffer), {
      contentType: file.type || undefined,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`上傳失敗：${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/**
 * 從先前回傳的 publicUrl 解析出 bucket 內路徑。
 * 用於「使用者上傳了新檔，舊檔要刪」場景。
 *
 * 例：
 *   https://xxx.supabase.co/storage/v1/object/public/uploads/tenants/abc.jpg
 *   → "tenants/abc.jpg"
 */
export function pathFromPublicUrl(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

/** 刪除指定路徑的檔案；錯誤吞掉（best-effort，不阻擋使用者）。 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const supabase = getClient();
    await supabase.storage.from(BUCKET).remove([path]);
  } catch (e) {
    console.error("[supabase:deleteFile]", e);
  }
}

/** 同上但接收 URL；若不是 Supabase URL 則靜默忽略。 */
export async function deleteFileByUrl(url: string | null | undefined): Promise<void> {
  if (!url) return;
  const path = pathFromPublicUrl(url);
  if (!path) return;
  await deleteFile(path);
}

function extOf(filename: string): string | null {
  const m = filename.match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toLowerCase() : null;
}

function extOfMime(mime: string): string | null {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "application/pdf") return "pdf";
  return null;
}
