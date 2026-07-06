import * as React from "react";
import { cn } from "@/lib/utils";

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

/** Labeled input with inline error + ARIA wiring (PRD 10.4, 10.6). */
export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, error, id, className, name, ...props }, ref) {
    const inputId = id ?? name;
    const errorId = error && inputId ? `${inputId}-error` : undefined;
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
          aria-describedby={errorId}
          className={cn(
            "h-11 rounded-md border bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30",
            error ? "border-red-500" : "border-ink/20",
            className
          )}
          {...props}
        />
        {error ? (
          <p id={errorId} role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
