import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, productVariants } from "@/db/schema";

/**
 * Cancels (or refunds) an order and atomically restocks its line items —
 * shared by the auto-cancel cron (stale pending_payment orders),
 * payment-decline webhooks, checkout's rollback when a payment provider
 * can't be reached at all, and admin cancel/refund actions.
 */
export async function cancelAndRestockOrder(
  orderId: string,
  targetStatus: "cancelled" | "refunded" = "cancelled"
): Promise<void> {
  await db.transaction(async (tx) => {
    const items = await tx
      .select({ productVariantId: orderItems.productVariantId, quantity: orderItems.quantity })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    for (const item of items) {
      await tx
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
        .where(eq(productVariants.id, item.productVariantId));
    }

    await tx.update(orders).set({ status: targetStatus }).where(eq(orders.id, orderId));
  });
}
