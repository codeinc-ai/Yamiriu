import { ORDER_STATUS_LABELS, ORDER_STATUS_BADGE_STYLES } from "@/lib/order-status";
import { cn } from "@/lib/utils";

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
        ORDER_STATUS_BADGE_STYLES[status] ?? "bg-ink/10 text-ink/70"
      )}
    >
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
