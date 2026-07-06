import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

/** Labeled input with always-visible label + inline error (PRD 10.4, 10.6). */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, hint, id, name, className, ...props }, ref) {
    const inputId = id ?? name;
    const errorId = error && inputId ? `${inputId}-error` : undefined;
    const hintId = hint && inputId ? `${inputId}-hint` : undefined;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
        <input
          id={inputId}
          name={name}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={cn(errorId, hintId) || undefined}
          className={cn(
            "h-11 rounded-md border bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30",
            error ? "border-red-500" : "border-ink/20",
            className
          )}
          {...props}
        />
        {hint && !error ? (
          <p id={hintId} className="text-xs text-ink/60">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
