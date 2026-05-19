"use client";
import { useState, useEffect } from "react";

type Props = {
  urls: string[];
  /** 顯示在 gallery 上方的標題，例如「房產圖片」 */
  title?: string;
};

/**
 * 唯讀圖片 gallery：縮圖網格 + 點擊放大 lightbox。
 *
 * - 縮圖：1:1 方形，cover 裁切
 * - lightbox：覆蓋全螢幕，點背景或 ✕ 關閉；ESC 也關閉
 * - 左右鍵切換上一張/下一張
 */
export function ImageGallery({ urls, title }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // 鍵盤事件：ESC 關閉、左右切換
  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
      else if (e.key === "ArrowLeft" && openIndex !== null) {
        setOpenIndex((i) => (i === null ? null : Math.max(0, i - 1)));
      } else if (e.key === "ArrowRight" && openIndex !== null) {
        setOpenIndex((i) => (i === null ? null : Math.min(urls.length - 1, i + 1)));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, urls.length]);

  if (urls.length === 0) return null;

  return (
    <section className="rounded-2xl bg-surface p-6 ring-1 ring-outline-variant">
      {title && (
        <h2 className="mb-4 text-lg font-medium text-on-surface">
          {title}（{urls.length} 張）
        </h2>
      )}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {urls.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-outline-variant transition-transform hover:scale-[1.02] hover:ring-primary/60"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`圖片 ${i + 1}`} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <Lightbox
          urls={urls}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onPrev={() => setOpenIndex((i) => (i === null ? null : Math.max(0, i - 1)))}
          onNext={() => setOpenIndex((i) => (i === null ? null : Math.min(urls.length - 1, i + 1)))}
        />
      )}
    </section>
  );
}

function Lightbox({
  urls,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  urls: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
    >
      {/* 關閉按鈕 */}
      <button
        type="button"
        onClick={onClose}
        aria-label="關閉"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>

      {/* 上一張 */}
      {index > 0 && (
        <button
          type="button"
          onClick={onPrev}
          aria-label="上一張"
          className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
            <path fillRule="evenodd" d="M12.78 5.22a.75.75 0 0 1 0 1.06L9.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {/* 下一張 */}
      {index < urls.length - 1 && (
        <button
          type="button"
          onClick={onNext}
          aria-label="下一張"
          className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
            <path fillRule="evenodd" d="M7.22 14.78a.75.75 0 0 1 0-1.06L10.94 10 7.22 6.28a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0Z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={urls[index]}
        alt={`圖片 ${index + 1} / ${urls.length}`}
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
      />

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/20 px-4 py-1.5 text-sm text-white backdrop-blur">
        {index + 1} / {urls.length}
      </div>
    </div>
  );
}
