import { NextResponse, type NextRequest } from "next/server";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { env } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit";
import { cancelAndRestockOrder } from "@/lib/orders/cancel-and-restock";

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * Cancels `pending_payment` orders older than 24h and restocks their items
 * (PRD 4.6). Scheduled via vercel.json's `crons` config — Vercel invokes
 * scheduled routes with `Authorization: Bearer $CRON_SECRET` automatically
 * (https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs);
 * `x-cron-secret` is also accepted for non-Vercel schedulers. Fails closed:
 * if CRON_SECRET isn't configured, the route refuses to run rather than
 * executing unauthenticated.
 */
export async function GET(request: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "Cron endpoint not configured." }, { status: 503 });
  }
  const authHeader = request.headers.get("authorization");
  const isAuthorized =
    authHeader === `Bearer ${env.CRON_SECRET}` || request.headers.get("x-cron-secret") === env.CRON_SECRET;
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - STALE_AFTER_MS);
  const staleOrders = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber })
    .from(orders)
    .where(and(eq(orders.status, "pending_payment"), lt(orders.createdAt, cutoff)));

  const cancelled: string[] = [];
  for (const staleOrder of staleOrders) {
    try {
      await cancelAndRestockOrder(staleOrder.id);

      await writeAuditLog({
        action: "order.status_changed",
        targetType: "order",
        targetId: staleOrder.id,
        metadata: { orderNumber: staleOrder.orderNumber, status: "cancelled", reason: "payment_timeout" },
      });
      cancelled.push(staleOrder.orderNumber);
    } catch (error) {
      console.error("[cron] failed to cancel stale order", staleOrder.orderNumber, error);
    }
  }

  return NextResponse.json({ cancelled: cancelled.length, orderNumbers: cancelled });
}
