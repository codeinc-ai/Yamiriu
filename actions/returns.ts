"use server";

import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { orders, returnRequests } from "@/db/schema";
import { withAuth } from "@/lib/auth-guards";
import { writeAuditLog } from "@/lib/audit";

/** Customer-initiated return request on a delivered order (PRD WF-009).
 * Ownership + status are re-checked server-side — the client never gets to
 * assert "this order is mine and delivered" on its own. */
const requestReturnSchema = z.object({
  orderNumber: z.string().trim().min(1),
  reason: z
    .string()
    .trim()
    .min(10, "Tell us a bit more about why you'd like to return this.")
    .max(1000, "That's a bit long — please keep it under 1000 characters."),
});

export interface RequestReturnResult {
  ok: boolean;
  error?: string;
}

export const requestReturn = withAuth(
  async (user, rawInput: unknown): Promise<RequestReturnResult> => {
    const parsed = requestReturnSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Please check the form and try again.",
      };
    }

    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.orderNumber, parsed.data.orderNumber.toUpperCase()),
        eq(orders.userId, user.id),
        isNull(orders.deletedAt)
      ),
    });
    if (!order) {
      return { ok: false, error: "That order could not be found." };
    }
    if (order.status !== "delivered") {
      return { ok: false, error: "Returns can only be requested for delivered orders." };
    }

    const existing = await db.query.returnRequests.findFirst({
      where: and(eq(returnRequests.orderId, order.id), isNull(returnRequests.deletedAt)),
    });
    if (existing && existing.status !== "denied") {
      return { ok: false, error: "A return request for this order is already in progress." };
    }

    const [created] = await db
      .insert(returnRequests)
      .values({ orderId: order.id, userId: user.id, reason: parsed.data.reason })
      .returning();

    await writeAuditLog({
      actorUserId: user.id,
      action: "return.requested",
      targetType: "order",
      targetId: order.id,
      metadata: { returnRequestId: created.id, orderNumber: order.orderNumber },
    });

    return { ok: true };
  }
);
