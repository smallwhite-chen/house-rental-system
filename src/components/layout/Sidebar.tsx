"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
  isNavItemActive,
  type NavItem,
} from "./nav-config";

const STORAGE_KEY = "sidebar-collapsed";

/**
 * 主側邊導覽列。
 *
 * 兩種狀態：
 *   - 展開（w-56）：icon + 文字
 *   - 收起（w-16）：僅 icon，hover 時 native tooltip 顯示文字
 *
 * 偏好寫入 localStorage，下次回來自動還原。
 * SSR 時用展開狀態避免水合錯位；mount 後若 localStorage 為收起再切換。
 */
export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // mount 後讀取 localStorage 偏好
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") setCollapsed(true);
    } catch {
      // localStorage 可能被瀏覽器禁用
    }
    setHydrated(true);
  }, []);

  // 切換時寫入 localStorage
  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <aside
      className={`hidden shrink-0 border-r border-outline-variant bg-surface-container py-3 md:block ${
        hydrated ? "transition-[width] duration-200" : ""
      } ${collapsed ? "w-16" : "w-56"}`}
    >
      <div className={`mb-2 flex px-3 ${collapsed ? "justify-center" : "justify-end"}`}>
        <button
          onClick={toggle}
          aria-label={collapsed ? "展開選單" : "收起選單"}
          title={collapsed ? "展開選單" : "收起選單"}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
        >
          <ChevronIcon direction={collapsed ? "right" : "left"} />
        </button>
      </div>

      <nav className="space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            pathname={pathname}
            collapsed={collapsed}
          />
        ))}

        <div className="my-3 border-t border-outline-variant" />

        {SECONDARY_NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            pathname={pathname}
            collapsed={collapsed}
          />
        ))}
      </nav>
    </aside>
  );
}

function SidebarLink({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const active = isNavItemActive(item, pathname);
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`flex w-full items-center rounded-full text-sm font-medium transition-colors ${
        collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-4 py-2.5"
      } ${
        active
          ? "bg-secondary-container text-on-secondary-container"
          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span aria-hidden="true">{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-5 w-5 transition-transform duration-200 ${direction === "right" ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12.78 5.22a.75.75 0 0 1 0 1.06L9.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
