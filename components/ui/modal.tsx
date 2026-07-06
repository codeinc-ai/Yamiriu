"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/use-hydrated";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

function trapTab(event: KeyboardEvent, container: HTMLElement | null) {
  if (!container) return;
  const nodes = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE)
  ).filter((el) => el.offsetParent !== null || el === document.activeElement);
  if (nodes.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || active === container)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/** Accessible dialog: focus trap, Esc to close, scroll lock, focus restore.
 * Entrance is CSS-driven (transform/opacity, motion-safe) — no animation state. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const previouslyFocused = React.useRef<HTMLElement | null>(null);
  const hydrated = useHydrated();
  const titleId = React.useId();
  const descId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (focusable ?? panelRef.current)?.focus();
    });

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      } else if (event.key === "Tab") {
        trapTab(event, panelRef.current);
      }
    }
    document.addEventListener("keydown", onKey);

    const restore = previouslyFocused.current;
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      restore?.focus?.();
    };
  }, [open, onClose]);

  if (!hydrated || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm motion-safe:animate-[yamiriu-fade-in_150ms_ease-out]"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "relative z-10 w-full max-w-lg rounded-xl border border-ink/10 bg-cream p-6 shadow-xl outline-none motion-safe:animate-[yamiriu-modal-in_150ms_ease-out]",
          className
        )}
      >
        {title ? (
          <h2 id={titleId} className="font-display text-xl text-ink">
            {title}
          </h2>
        ) : null}
        {description ? (
          <p id={descId} className="mt-1 text-sm text-ink/70">
            {description}
          </p>
        ) : null}
        <div className={cn(title || description ? "mt-4" : undefined)}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
