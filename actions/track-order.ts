"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, productVariants, products, users } from "@/db/schema";
import { emailSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

const inputSchema = z.object({
  orderNumber: z.string().trim().min(1).max(20),
  email: emailSchema,
});

export interface TrackOrderItem {
  productName: string;
  productSlug: string;
  size: string;
  color: string;
  quantity: number;
  priceAtPurchase: string;
}

export interface TrackOrderResult {
  ok: boolean;
  error?: string;
  order?: {
    orderNumber: string;
    status: string;
    total: string;
    trackingNumber: string | null;
    courierProvider: string | null;
    createdAt: string;
    items: TrackOrderItem[];
  };
}

const GENERIC_ERROR =
  "We couldn't find a matching order. Double-check your order number and the email used at checkout.";

/**
 * Public order lookup (PRD 4.6, S-006 enumeration prevention). A single query
 * matches order number AND email together — a wrong order number and a wrong
 * email for a real order both produce the exact same {ok:false} shape, so
 * neither can be used to probe which part was incorrect.
 */
export async function trackOrder(input: unknown): Promise<TrackOrderResult> {
  const ip = getClientIp(await headers());
  const rl = await checkRateLimit("auth", ip);
  if (!rl.success) {
    return { ok: false, error: "Too many attempts. Please try again in a minute." };
  }

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const orderNumber = parsed.data.orderNumber.toUpperCase();
  const email = parsed.data.email;

  const matched = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      trackingNumber: orders.trackingNumber,
      courierProvider: orders.courierProvider,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(
      and(
        eq(orders.orderNumber, orderNumber),
        or(eq(orders.guestEmail, email), eq(users.email, email))
      )
    )
    .limit(1);

  const found = matched[0];
  if (!found) {
    return { ok: false, error: GENERIC_ERROR };
  }

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
    .where(eq(orderItems.orderId, found.id));

  return {
    ok: true,
    order: {
      orderNumber: found.orderNumber,
      status: found.status,
      total: found.total,
      trackingNumber: found.trackingNumber,
      courierProvider: found.courierProvider,
      createdAt: found.createdAt.toISOString(),
      items,
    },
  };
}
