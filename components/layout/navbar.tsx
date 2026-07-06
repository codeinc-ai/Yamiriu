"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_CATEGORIES } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { UserIcon, BagIcon, MenuIcon } from "./icons";
import { CartCount, useCartLabel } from "./cart-count";
import { MobileDrawer } from "./mobile-drawer";

export function Navbar({ showAdminLink = false }: { showAdminLink?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const cartLabel = useCartLabel();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-300",
        scrolled
          ? "border-b border-ink/10 bg-cream/90 backdrop-blur"
          : "bg-cream/50 backdrop-blur-sm"
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        {/* Left: mobile menu + logo */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            className="inline-flex size-11 items-center justify-center rounded-md text-ink hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta md:hidden"
          >
            <MenuIcon className="size-5" />
          </button>
          <Link
            href="/"
            className="font-display text-xl font-bold uppercase tracking-[0.2em] text-ink"
          >
            Yamiriu
          </Link>
        </div>

        {/* Center: category nav */}
        <div className="hidden items-center gap-7 md:flex">
          {NAV_CATEGORIES.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm text-ink/80 transition-colors hover:text-ink",
                pathname === item.href && "text-ink"
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/outfit-builder"
            className="rounded-full bg-terracotta/10 px-3 py-1.5 text-sm font-medium text-terracotta transition-colors hover:bg-terracotta/20"
          >
            Outfit Builder
          </Link>
        </div>

        {/* Right: account + cart */}
        <div className="flex items-center gap-1">
          {showAdminLink ? (
            <Link
              href="/admin"
              className="hidden rounded-full bg-ink/8 px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-ink/15 sm:inline-flex"
            >
              Admin
            </Link>
          ) : null}
          <Link
            href="/account"
            aria-label="Account"
            className="inline-flex size-11 items-center justify-center rounded-md text-ink hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            <UserIcon className="size-5" />
          </Link>
          <Link
            href="/cart"
            aria-label={cartLabel}
            className="relative inline-flex size-11 items-center justify-center rounded-md text-ink hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            <BagIcon className="size-5" />
            <CartCount />
          </Link>
        </div>
      </nav>

      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
