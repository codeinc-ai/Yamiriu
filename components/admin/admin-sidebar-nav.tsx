"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-nav";
import type { Permission } from "@/lib/rbac";
import { cn } from "@/lib/utils";

/** Horizontal scroll strip on mobile, vertical sidebar from md up — same
 * pattern as AccountSidebarNav, filtered to the permissions passed in. */
export function AdminSidebarNav({ permissions }: { permissions: readonly Permission[] }) {
  const pathname = usePathname();
  const allowed = new Set(permissions);
  const items = ADMIN_NAV_ITEMS.filter((item) => allowed.has(item.permission));

  return (
    <nav
      aria-label="Admin"
      className="flex gap-1 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin] md:flex-col md:overflow-visible md:pb-0"
    >
      {items.map((item) => {
        const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "min-h-[44px] shrink-0 rounded-md px-3 py-2.5 text-sm font-medium transition-colors md:shrink",
              active ? "bg-ink text-cream" : "text-ink/70 hover:bg-ink/5 hover:text-ink"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
