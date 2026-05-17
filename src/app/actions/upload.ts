"use server";
import { requireUserContext } from "@/lib/rbac";
import {
  uploadFile,
  IMAGE_MIME_TYPES,
  PDF_MIME_TYPES,
  DEFAULT_MAX_SIZE,
} from "@/lib/supabase-storage";

/**
 * 通用檔案上傳 Server Action。
 *
 * 給 FileUpload 共用元件呼叫。回傳 { url } 或 { error }。
 *
 * - 一定要登入（不分模組權限；個別欄位的權限由表單頁面層級已把關）
 * - kind 控制允許的型別與大小：image | pdf
 */
export async function uploadFileAction(
  prefix: string,
  kind: "image" | "pdf",
  fd: FormData
): Promise<{ url?: string; error?: string }> {
  await requireUserContext();

  const file = fd.get("file");
  if (!(file instanceof File)) return { error: "未選擇檔案" };
  if (file.size === 0) return { error: "檔案為空" };

  // 白名單清洗：只允許英數與少量符號
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!cleanPrefix) return { error: "Prefix 無效" };

  try {
    const result = await uploadFile(file, cleanPrefix, {
      allowedTypes: kind === "pdf" ? PDF_MIME_TYPES : IMAGE_MIME_TYPES,
      maxSize: DEFAULT_MAX_SIZE,
    });
    return { url: result.url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "上傳失敗，請稍後再試";
    console.error("[upload]", e);
    return { error: msg };
  }
}
