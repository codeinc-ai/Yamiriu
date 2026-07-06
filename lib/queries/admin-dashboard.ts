import "server-only";
import { and, eq, gte, isNull, lte, ne, sql, desc, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, productVariants, products, auditLog, users } from "@/db/schema";

/** Variant stock at or below this surfaces a low-stock alert (given directly
 * by the founders, not derived from the PRD). */
export const LOW_STOCK_THRESHOLD = 5;

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export interface DashboardKpis {
  todaysOrders: number;
  todaysRevenue: number;
  pendingCodReviews: number;
  lowStockCount: number;
  /**
   * Proxy metric only: share of the last 30 days' orders that included at
   * least one outfit-builder item, derived from order_items.outfitGroupId.
   * This is NOT the true PostHog outfit_builder_opened -> added_to_cart
   * funnel (those events aren't queryable from Postgres) — see PostHog for
   * the full funnel; this just tracks purchases that originated as outfits.
   */
  outfitConversionPercent: number;
}

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const today = startOfToday();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [[todaysOrdersRow], [revenueRow], [codReviewRow], [lowStockRow], [totalOrdersRow], [outfitOrdersRow]] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(and(gte(orders.createdAt, today), isNull(orders.deletedAt))),
      db
        .select({ sum: sql<string>`coalesce(sum(${orders.total}), 0)` })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, today),
            isNull(orders.deletedAt),
            ne(orders.status, "cancelled"),
            ne(orders.status, "refunded")
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(and(eq(orders.status, "pending_review"), isNull(orders.deletedAt))),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(productVariants)
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(
          and(
            lte(productVariants.stock, LOW_STOCK_THRESHOLD),
            isNull(productVariants.deletedAt),
            isNull(products.deletedAt)
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(and(gte(orders.createdAt, thirtyDaysAgo), isNull(orders.deletedAt))),
      db
        .select({ count: sql<number>`count(distinct ${orders.id})::int` })
        .from(orders)
        .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
        .where(
          and(
            gte(orders.createdAt, thirtyDaysAgo),
            isNull(orders.deletedAt),
            isNotNull(orderItems.outfitGroupId)
          )
        ),
    ]);

  const totalOrders = totalOrdersRow?.count ?? 0;
  const outfitOrders = outfitOrdersRow?.count ?? 0;

  return {
    todaysOrders: todaysOrdersRow?.count ?? 0,
    todaysRevenue: Number(revenueRow?.sum ?? 0),
    pendingCodReviews: codReviewRow?.count ?? 0,
    lowStockCount: lowStockRow?.count ?? 0,
    outfitConversionPercent: totalOrders > 0 ? Math.round((outfitOrders / totalOrders) * 100) : 0,
  };
}

export interface RecentOrderRow {
  orderNumber: string;
  status: string;
  total: string;
  customerEmail: string | null;
  createdAt: string;
}

export async function getRecentOrders(limit = 10): Promise<RecentOrderRow[]> {
  const rows = await db
    .select({
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      guestEmail: orders.guestEmail,
      userEmail: users.email,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(isNull(orders.deletedAt))
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    orderNumber: r.orderNumber,
    status: r.status,
    total: r.total,
    customerEmail: r.guestEmail ?? r.userEmail,
    createdAt: r.createdAt.toISOString(),
  }));
}

export interface RecentAuditEntry {
  action: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
}

/** PII-free by construction — audit_log.metadata never stores it (S-023),
 * and this surfaces action/target only, never actor identity beyond id. */
export async function getRecentAuditActivity(limit = 10): Promise<RecentAuditEntry[]> {
  const rows = await db
    .select({
      action: auditLog.action,
      targetType: auditLog.targetType,
      targetId: auditLog.targetId,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    action: r.action,
    targetType: r.targetType,
    targetId: r.targetId,
    createdAt: r.createdAt.toISOString(),
  }));
}
