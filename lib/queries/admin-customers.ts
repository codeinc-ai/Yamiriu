import "server-only";
import { and, or, eq, gt, lt, ilike, inArray, isNull, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, orders, savedOutfits } from "@/db/schema";
import { encodeCursor, decodeCursor } from "@/lib/cursor";

const ADMIN_CUSTOMERS_PAGE_SIZE = 20;

export interface AdminCustomerListItem {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  orderCount: number;
  createdAt: string;
}

export interface AdminCustomerListResult {
  items: AdminCustomerListItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

export async function getAdminCustomerList(params: {
  search?: string;
  cursor?: string | null;
}): Promise<AdminCustomerListResult> {
  const conditions = [eq(users.role, "customer"), isNull(users.deletedAt)];

  if (params.search?.trim()) {
    const term = `%${params.search.trim()}%`;
    conditions.push(or(ilike(users.email, term), ilike(users.name, term))!);
  }

  if (params.cursor) {
    const decoded = decodeCursor(params.cursor);
    if (decoded) {
      const value = new Date(decoded.v);
      conditions.push(
        or(lt(users.createdAt, value), and(eq(users.createdAt, value), gt(users.id, decoded.id)))!
      );
    }
  }

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(desc(users.createdAt), users.id)
    .limit(ADMIN_CUSTOMERS_PAGE_SIZE + 1);

  const hasMore = rows.length > ADMIN_CUSTOMERS_PAGE_SIZE;
  const items = hasMore ? rows.slice(0, ADMIN_CUSTOMERS_PAGE_SIZE) : rows;
  const last = items[items.length - 1];

  const userIds = items.map((r) => r.id);
  const orderCounts =
    userIds.length > 0
      ? await db
          .select({ userId: orders.userId, count: sql<number>`count(*)::int` })
          .from(orders)
          .where(inArray(orders.userId, userIds))
          .groupBy(orders.userId)
      : [];

  const countByUserId = new Map(orderCounts.map((r) => [r.userId, r.count]));

  return {
    items: items.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      isActive: r.isActive,
      orderCount: countByUserId.get(r.id) ?? 0,
      createdAt: r.createdAt.toISOString(),
    })),
    hasMore,
    nextCursor: hasMore && last ? encodeCursor(last.createdAt.toISOString(), last.id) : null,
  };
}

export interface AdminCustomerDetail {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: string;
  orders: Array<{ orderNumber: string; status: string; total: string; createdAt: string }>;
  codReliability: { totalCodOrders: number; refusedCodOrders: number };
  savedOutfitsCount: number;
}

export async function getAdminCustomerDetail(userId: string): Promise<AdminCustomerDetail | null> {
  const user = await db.query.users.findFirst({
    where: and(eq(users.id, userId), eq(users.role, "customer"), isNull(users.deletedAt)),
  });
  if (!user) return null;

  const orderRows = await db
    .select({
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      paymentMethod: orders.paymentMethod,
      codRefused: orders.codRefused,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(eq(orders.userId, userId), isNull(orders.deletedAt)))
    .orderBy(desc(orders.createdAt));

  const codOrders = orderRows.filter((o) => o.paymentMethod === "cod");
  const [savedOutfitsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(savedOutfits)
    .where(and(eq(savedOutfits.userId, userId), isNull(savedOutfits.deletedAt)));

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    orders: orderRows.map((o) => ({
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt.toISOString(),
    })),
    codReliability: {
      totalCodOrders: codOrders.length,
      refusedCodOrders: codOrders.filter((o) => o.codRefused).length,
    },
    savedOutfitsCount: savedOutfitsRow?.count ?? 0,
  };
}
