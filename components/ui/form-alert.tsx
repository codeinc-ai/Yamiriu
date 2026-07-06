import { cn } from "@/lib/utils";

/** Inline success/error banner for forms (PRD 10.4 feedback). */
export function FormAlert({
  variant,
  children,
}: {
  variant: "success" | "error";
  children: React.ReactNode;
}) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md border px-3 py-2.5 text-sm",
        variant === "success"
          ? "border-olive/30 bg-olive/10 text-olive"
          : "border-red-500/30 bg-red-50 text-red-700"
      )}
    >
      {children}
    </div>
  );
}
