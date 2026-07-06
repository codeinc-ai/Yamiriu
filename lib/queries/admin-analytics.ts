import "server-only";
import { and, gte, isNull, ne, sql, eq, isNotNull, desc } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, productVariants, products, analyticsEvents } from "@/db/schema";

export interface SalesDayPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

export async function getSalesOverTime(days = 30): Promise<SalesDayPoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
      revenue: sql<string>`coalesce(sum(${orders.total}), 0)`,
      orderCount: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, since),
        isNull(orders.deletedAt),
        ne(orders.status, "cancelled"),
        ne(orders.status, "refunded")
      )
    )
    .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

  return rows.map((r) => ({ date: r.day, revenue: Number(r.revenue), orderCount: r.orderCount }));
}

export interface BestsellerRow {
  productId: string;
  name: string;
  quantitySold: number;
  revenue: number;
}

export async function getBestsellersReport(limit = 10): Promise<BestsellerRow[]> {
  const rows = await db
    .select({
      productId: products.id,
      name: products.name,
      quantitySold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
      revenue: sql<string>`coalesce(sum(${orderItems.quantity} * ${orderItems.priceAtPurchase}), 0)`,
    })
    .from(orderItems)
    .innerJoin(productVariants, eq(orderItems.productVariantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .groupBy(products.id, products.name)
    .orderBy(desc(sql`coalesce(sum(${orderItems.quantity}), 0)`))
    .limit(limit);

  return rows.map((r) => ({ ...r, revenue: Number(r.revenue) }));
}

export interface OutfitFunnelStep {
  step: string;
  count: number;
}

/**
 * PostHog remains the source of truth for full funnel analysis — the first
 * three steps here come from analytics_events (a local proxy dual-fired
 * alongside PostHog, see lib/analytics.ts), and "ordered" from order_items,
 * both scoped to the same trailing window for a rough same-database view.
 */
export async function getOutfitFunnel(days = 30): Promise<OutfitFunnelStep[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [openedRow, selectedRow, addedRow, orderedRow] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.event, "outfit_builder_opened"), gte(analyticsEvents.createdAt, since))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.event, "outfit_item_selected"), gte(analyticsEvents.createdAt, since))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.event, "outfit_added_to_cart"), gte(analyticsEvents.createdAt, since))),
    db
      .select({ count: sql<number>`count(distinct ${orders.id})::int` })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(and(gte(orders.createdAt, since), isNull(orders.deletedAt), isNotNull(orderItems.outfitGroupId))),
  ]);

  return [
    { step: "Opened builder", count: openedRow[0]?.count ?? 0 },
    { step: "Selected an item", count: selectedRow[0]?.count ?? 0 },
    { step: "Added to cart", count: addedRow[0]?.count ?? 0 },
    { step: "Ordered", count: orderedRow[0]?.count ?? 0 },
  ];
}
