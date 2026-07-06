"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ACCOUNT_NAV_ITEMS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/saved-outfits", label: "Saved Outfits" },
  { href: "/account/settings", label: "Settings" },
] as const;

/** Horizontal scroll strip on mobile, vertical sidebar from md up. */
export function AccountSidebarNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Account"
      className="flex gap-1 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin] md:flex-col md:overflow-visible md:pb-0"
    >
      {ACCOUNT_NAV_ITEMS.map((item) => {
        const active = item.href === "/account" ? pathname === item.href : pathname.startsWith(item.href);
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
