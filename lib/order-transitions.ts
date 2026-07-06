/** Happy-path + terminal transitions an admin may drive manually (PRD 4.8.5).
 * Shared between the Server Action (actions/admin/orders.ts, source of
 * truth) and the client status-action buttons so the UI never offers a
 * transition the server would reject. Payment-confirmation
 * (pending_payment -> confirmed) and COD reconciliation
 * (pending_review -> confirmed/cancelled) go through their own actions. */
export const ALLOWED_ORDER_TRANSITIONS: Record<string, readonly string[]> = {
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
};

/** Cancelling or refunding moves money/stock, so it needs `orders:refund`
 * rather than plain `orders:write`. */
export const MONEY_MOVEMENT_TARGETS = new Set(["cancelled", "refunded"]);
