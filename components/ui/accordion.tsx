"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  value: string;
  trigger: React.ReactNode;
  content: React.ReactNode;
}

/** Single-open accordion. Chevron uses transform only; content toggles via
 * `hidden` (no height animation) to keep to the 60fps transform/opacity rule. */
export function Accordion({
  items,
  defaultValue,
  className,
}: {
  items: AccordionItem[];
  defaultValue?: string;
  className?: string;
}) {
  const [openValue, setOpenValue] = React.useState<string | null>(
    defaultValue ?? null
  );

  return (
    <div
      className={cn(
        "divide-y divide-ink/10 overflow-hidden rounded-xl border border-ink/10",
        className
      )}
    >
      {items.map((item) => {
        const isOpen = openValue === item.value;
        const triggerId = `accordion-trigger-${item.value}`;
        const panelId = `accordion-panel-${item.value}`;
        return (
          <div key={item.value}>
            <h3 className="m-0">
              <button
                id={triggerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenValue(isOpen ? null : item.value)}
                className="flex w-full items-center justify-between gap-4 bg-white/40 px-5 py-4 text-left text-sm font-medium text-ink transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-terracotta"
              >
                <span>{item.trigger}</span>
                <svg
                  className={cn(
                    "size-4 shrink-0 text-ink/60 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              hidden={!isOpen}
              className="bg-white/20 px-5 pb-5 pt-1 text-sm leading-relaxed text-ink/70"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
