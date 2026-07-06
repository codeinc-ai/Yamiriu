import "server-only";
import { and, or, eq, gt, lt, gte, lte, inArray, isNull, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, productVariants, products, users } from "@/db/schema";
import { encodeCursor, decodeCursor } from "@/lib/cursor";

const ADMIN_ORDERS_PAGE_SIZE = 20;

export interface AdminOrderListParams {
  status?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  /** COD orders currently held for admin review (S-029). */
  codFlagged?: boolean;
  cursor?: string | null;
}

export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  total: string;
  customerEmail: string | null;
  customerPhone: string;
  itemCount: number;
  createdAt: string;
}

export interface AdminOrderListResult {
  items: AdminOrderListItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

export async function getAdminOrderList(
  params: AdminOrderListParams
): Promise<AdminOrderListResult> {
  const conditions = [isNull(orders.deletedAt)];

  if (params.status) conditions.push(eq(orders.status, params.status as (typeof orders.status.enumValues)[number]));
  if (params.paymentMethod)
    conditions.push(eq(orders.paymentMethod, params.paymentMethod as (typeof orders.paymentMethod.enumValues)[number]));
  if (params.codFlagged) conditions.push(eq(orders.status, "pending_review"));
  if (params.dateFrom) conditions.push(gte(orders.createdAt, new Date(params.dateFrom)));
  if (params.dateTo) conditions.push(lte(orders.createdAt, new Date(params.dateTo)));

  if (params.cursor) {
    const decoded = decodeCursor(params.cursor);
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
      paymentMethod: orders.paymentMethod,
      total: orders.total,
      guestEmail: orders.guestEmail,
      customerPhone: orders.customerPhone,
      userEmail: users.email,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt), orders.id)
    .limit(ADMIN_ORDERS_PAGE_SIZE + 1);

  const hasMore = rows.length > ADMIN_ORDERS_PAGE_SIZE;
  const items = hasMore ? rows.slice(0, ADMIN_ORDERS_PAGE_SIZE) : rows;
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
      id: r.id,
      orderNumber: r.orderNumber,
      status: r.status,
      paymentMethod: r.paymentMethod,
      total: r.total,
      customerEmail: r.guestEmail ?? r.userEmail,
      customerPhone: r.customerPhone,
      itemCount: countByOrderId.get(r.id) ?? 0,
      createdAt: r.createdAt.toISOString(),
    })),
    hasMore,
    nextCursor: hasMore && last ? encodeCursor(last.createdAt.toISOString(), last.id) : null,
  };
}

export interface AdminOrderDetailItem {
  productName: string;
  productSlug: string;
  size: string;
  color: string;
  quantity: number;
  priceAtPurchase: string;
  outfitGroupId: string | null;
}

export interface AdminOrderDetail {
  id: string;
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
  customerEmail: string | null;
  customerPhone: string;
  codRefused: boolean;
  providerTransactionId: string | null;
  trackingNumber: string | null;
  courierProvider: string | null;
  createdAt: string;
  items: AdminOrderDetailItem[];
}

/** Admin lookup by public order number — no ownership scoping (staff can see
 * any order), but still requires the caller to hold orders:read (checked at
 * the Server Action/page level, per PRD Rule 12). */
export async function getAdminOrderDetail(orderNumber: string): Promise<AdminOrderDetail | null> {
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.orderNumber, orderNumber.toUpperCase()), isNull(orders.deletedAt)),
  });
  if (!order) return null;

  let customerEmail = order.guestEmail;
  if (!customerEmail && order.userId) {
    const user = await db.query.users.findFirst({ where: eq(users.id, order.userId) });
    customerEmail = user?.email ?? null;
  }

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
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    discountCode: order.discountCode,
    discountAmount: order.discountAmount,
    shippingCost: order.shippingCost,
    total: order.total,
    shippingAddress: order.shippingAddress as AdminOrderDetail["shippingAddress"],
    customerEmail,
    customerPhone: order.customerPhone,
    codRefused: order.codRefused,
    providerTransactionId: order.providerTransactionId,
    trackingNumber: order.trackingNumber,
    courierProvider: order.courierProvider,
    createdAt: order.createdAt.toISOString(),
    items,
  };
}

/** COD reconciliation queue — orders currently held for review (S-029). */
export async function getCodReconciliationQueue(): Promise<AdminOrderListItem[]> {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentMethod: orders.paymentMethod,
      total: orders.total,
      guestEmail: orders.guestEmail,
      customerPhone: orders.customerPhone,
      userEmail: users.email,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(and(eq(orders.status, "pending_review"), isNull(orders.deletedAt)))
    .orderBy(desc(orders.createdAt));

  return rows.map((r) => ({
    id: r.id,
    orderNumber: r.orderNumber,
    status: r.status,
    paymentMethod: r.paymentMethod,
    total: r.total,
    customerEmail: r.guestEmail ?? r.userEmail,
    customerPhone: r.customerPhone,
    itemCount: 0,
    createdAt: r.createdAt.toISOString(),
  }));
}
