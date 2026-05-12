"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
  isNavItemActive,
  type NavItem,
} from "./nav-config";

/**
 * 主側邊導覽列。
 *
 * 224px 寬、bg-surface-container 底色。
 * active 狀態：bg-secondary-container + text-on-secondary-container，圓角 full（pill）。
 * non-active：text-on-surface-variant，hover 時上一層 surface-container-high。
 *
 * 由 (dashboard)/layout.tsx 渲染，整個 dashboard route group 共用。
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-outline-variant bg-surface-container py-4 md:block">
      <nav className="space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}

        <div className="my-3 border-t border-outline-variant" />

        {SECONDARY_NAV_ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
    </aside>
  );
}

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isNavItemActive(item, pathname);
  return (
    <Link
      href={item.href}
      className={`flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-secondary-container text-on-secondary-container"
          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span aria-hidden="true">{item.icon}</span>
      {item.label}
    </Link>
  );
}
