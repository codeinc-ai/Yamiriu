"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { NAV_CATEGORIES } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { CloseIcon } from "./icons";

const LINKS = [
  ...NAV_CATEGORIES,
  { label: "Outfit Builder", href: "/outfit-builder" },
  { label: "Lookbook", href: "/lookbook" },
  { label: "Account", href: "/account" },
  { label: "Cart", href: "/cart" },
];

export function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 md:hidden",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={cn(
          "absolute right-0 top-0 flex h-full w-72 max-w-[80%] flex-col bg-cream shadow-xl transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <span className="font-display text-lg font-bold uppercase tracking-[0.2em] text-ink">
            Yamiriu
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex size-11 items-center justify-center rounded-md text-ink hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={cn(
                "rounded-md px-3 py-3 text-base text-ink hover:bg-ink/5",
                link.label === "Outfit Builder" && "font-medium text-terracotta"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
