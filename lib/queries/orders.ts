import "server-only";
import { and, desc, eq, gt, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, productVariants, products } from "@/db/schema";
import { encodeCursor, decodeCursor } from "@/lib/cursor";

export interface OrderConfirmationItem {
  productName: string;
  productSlug: string;
  size: string;
  color: string;
  quantity: number;
  priceAtPurchase: string;
}

export interface OrderConfirmation {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  subtotal: string;
  discountCode: string | null;
  discountAmount: string;
  shippingCost: string;
  total: string;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    province?: string | null;
  };
  createdAt: string;
  items: OrderConfirmationItem[];
}

/**
 * Order lookup by public order number only — no email/session check. This
 * matches common post-checkout confirmation UX (Shopify/WooCommerce style):
 * the immediate confirmation page is reachable via the order token the
 * customer's own checkout submission just produced. This is intentionally
 * looser than /track-order (S-006), which requires order number + email
 * together since it's designed for repeated, unauthenticated lookups and
 * carries a higher enumeration risk.
 */
export async function getOrderByNumber(orderNumber: string): Promise<OrderConfirmation | null> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.orderNumber, orderNumber.toUpperCase()),
  });
  if (!order) return null;

  const items = await db
    .select({
      productName: products.name,
      productSlug: products.slug,
      size: productVariants.size,
      color: productVariants.color,
      quantity: orderItems.quantity,
      priceAtPurchase: orderItems.priceAtPurchase,
    })
    .from(orderItems)
    .innerJoin(productVariants, eq(orderItems.productVariantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(orderItems.orderId, order.id));

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    discountCode: order.discountCode,
    discountAmount: order.discountAmount,
    shippingCost: order.shippingCost,
    total: order.total,
    shippingAddress: order.shippingAddress as OrderConfirmation["shippingAddress"],
    createdAt: order.createdAt.toISOString(),
    items,
  };
}

// ---------------------------------------------------------------------------
// /account/orders — row-level scoped to the signed-in user (S-024)
// ---------------------------------------------------------------------------

const ORDERS_PAGE_SIZE = 10;

export interface OrderListItem {
  orderNumber: string;
  status: string;
  total: string;
  itemCount: number;
  createdAt: string;
}

export interface OrderListResult {
  items: OrderListItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

/** Every condition here includes `eq(orders.userId, userId)` — never trust a
 * cursor or any other client input to scope which rows are visible. */
export async function getOrdersForUser(
  userId: string,
  cursor?: string | null
): Promise<OrderListResult> {
  const conditions = [eq(orders.userId, userId), isNull(orders.deletedAt)];

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      const value = new Date(decoded.v);
      conditions.push(
        or(lt(orders.createdAt, value), and(eq(orders.createdAt, value), gt(orders.id, decoded.id)))!
      );
    }
  }

  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt), orders.id)
    .limit(ORDERS_PAGE_SIZE + 1);

  const hasMore = rows.length > ORDERS_PAGE_SIZE;
  const items = hasMore ? rows.slice(0, ORDERS_PAGE_SIZE) : rows;
  const last = items[items.length - 1];

  const orderIds = items.map((r) => r.id);
  const itemCounts =
    orderIds.length > 0
      ? await db
          .select({ orderId: orderItems.orderId, count: sql<number>`count(*)::int` })
          .from(orderItems)
          .where(inArray(orderItems.orderId, orderIds))
          .groupBy(orderItems.orderId)
      : [];
  const countByOrderId = new Map(itemCounts.map((r) => [r.orderId, r.count]));

  return {
    items: items.map((r) => ({
      orderNumber: r.orderNumber,
      status: r.status,
      total: r.total,
      itemCount: countByOrderId.get(r.id) ?? 0,
      createdAt: r.createdAt.toISOString(),
    })),
    hasMore,
    nextCursor: hasMore && last ? encodeCursor(last.createdAt.toISOString(), last.id) : null,
  };
}

export interface OrderDetailItem {
  productName: string;
  productSlug: string;
  size: string;
  color: string;
  quantity: number;
  priceAtPurchase: string;
  outfitGroupId: string | null;
}

export interface OrderDetail {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  subtotal: string;
  discountCode: string | null;
  discountAmount: string;
  shippingCost: string;
  total: string;
  shippingAddress: {
    fullName: string;
    phone?: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    province?: string | null;
    postalCode?: string | null;
  };
  trackingNumber: string | null;
  courierProvider: string | null;
  createdAt: string;
  items: OrderDetailItem[];
}

/**
 * Ownership-scoped order detail (S-024) — the WHERE clause requires
 * `userId` to match in the SAME query that looks up the order, so a
 * mismatched owner returns `null` identically to a nonexistent order
 * (no distinguishing signal an attacker could use to enumerate valid ids).
 */
export async function getOrderDetailForUser(
  userId: string,
  orderNumber: string
): Promise<OrderDetail | null> {
  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.orderNumber, orderNumber.toUpperCase()),
      eq(orders.userId, userId),
      isNull(orders.deletedAt)
    ),
  });
  if (!order) return null;

  const items = await db
    .select({
      productName: products.name,
      productSlug: products.slug,
      size: productVariants.size,
      color: productVariants.color,
      quantity: orderItems.quantity,
      priceAtPurchase: orderItems.priceAtPurchase,
      outfitGroupId: orderItems.outfitGroupId,
    })
    .from(orderItems)
    .innerJoin(productVariants, eq(orderItems.productVariantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(orderItems.orderId, order.id));

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    discountCode: order.discountCode,
    discountAmount: order.discountAmount,
    shippingCost: order.shippingCost,
    total: order.total,
    shippingAddress: order.shippingAddress as OrderDetail["shippingAddress"],
    trackingNumber: order.trackingNumber,
    courierProvider: order.courierProvider,
    createdAt: order.createdAt.toISOString(),
    items,
  };
}
