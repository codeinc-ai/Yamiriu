export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending Payment",
  pending_review: "Under Review",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const ORDER_STATUS_BADGE_STYLES: Record<string, string> = {
  pending_payment: "bg-gold/10 text-gold",
  pending_review: "bg-gold/10 text-gold",
  confirmed: "bg-olive/10 text-olive",
  processing: "bg-olive/10 text-olive",
  shipped: "bg-terracotta/10 text-terracotta",
  delivered: "bg-olive/10 text-olive",
  cancelled: "bg-red-50 text-red-700",
  refunded: "bg-red-50 text-red-700",
};

/** Simplified 4-stage happy-path timeline (PRD 4.7) — cancelled/refunded
 * orders fall outside it and are shown as a distinct terminal state instead. */
export const ORDER_TIMELINE_STAGES = [
  { label: "Pending", statuses: ["pending_payment", "pending_review"] },
  { label: "Confirmed", statuses: ["confirmed", "processing"] },
  { label: "Shipped", statuses: ["shipped"] },
  { label: "Delivered", statuses: ["delivered"] },
] as const;

/** Index of the current stage, or -1 if the order isn't on the happy path
 * (cancelled/refunded). */
export function getOrderTimelineStageIndex(status: string): number {
  return ORDER_TIMELINE_STAGES.findIndex((stage) =>
    (stage.statuses as readonly string[]).includes(status)
  );
}
