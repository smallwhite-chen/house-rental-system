/**
 * 將過去時間轉成繁中相對描述。
 *
 * 規則：
 * - <1 分鐘   → 剛剛
 * - <1 小時   → N 分鐘前
 * - <24 小時  → N 小時前
 * - <7 天     → N 天前
 * - 其他      → YYYY-MM-DD（絕對日期）
 */
export function formatRelativeTime(d: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 0) return d.toISOString().slice(0, 10);

  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "剛剛";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分鐘前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小時前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} 天前`;
  return d.toISOString().slice(0, 10);
}
