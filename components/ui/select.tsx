import * as React from "react";
import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
};

/** Labeled native select, styled to match Input (PRD 10.4, 10.6). */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, error, id, name, className, children, ...props }, ref) {
    const selectId = id ?? name;
    const errorId = error && selectId ? `${selectId}-error` : undefined;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={selectId} className="text-sm font-medium text-ink">
          {label}
        </label>
        <select
          id={selectId}
          name={name}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            "h-11 rounded-md border bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-terracotta focus:ring-2 focus:ring-terracotta/30",
            error ? "border-red-500" : "border-ink/20",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error ? (
          <p id={errorId} role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
