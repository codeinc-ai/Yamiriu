"use server";

import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, productVariants, reviews } from "@/db/schema";
import { withAuth } from "@/lib/auth-guards";
import { writeAuditLog } from "@/lib/audit";

const submitReviewSchema = z.object({
  productId: z.string().trim().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().max(3000).optional().or(z.literal("")),
  photoUrls: z.array(z.string().trim().url()).max(3).optional(),
});

export interface SubmitReviewResult {
  ok: boolean;
  error?: string;
}

/** Only customers with a DELIVERED order containing this product may review
 * it (PRD 4.7) — re-verified here via a join, never trusted from the client. */
async function hasDeliveredOrderForProduct(userId: string, productId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: orders.id })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .innerJoin(productVariants, eq(orderItems.productVariantId, productVariants.id))
    .where(
      and(
        eq(orders.userId, userId),
        eq(orders.status, "delivered"),
        eq(productVariants.productId, productId)
      )
    )
    .limit(1);
  return Boolean(row);
}

export const submitReview = withAuth(
  async (user, rawInput: unknown): Promise<SubmitReviewResult> => {
    const parsed = submitReviewSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { ok: false, error: "Please check the form and try again." };
    }

    const eligible = await hasDeliveredOrderForProduct(user.id, parsed.data.productId);
    if (!eligible) {
      return {
        ok: false,
        error: "You can review a product once your order for it has been delivered.",
      };
    }

    const existing = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.productId, parsed.data.productId),
        eq(reviews.userId, user.id),
        isNull(reviews.deletedAt)
      ),
    });
    if (existing) {
      return { ok: false, error: "You've already reviewed this product." };
    }

    // Strip all HTML entirely (S-011) — reviews are plain text, so there's
    // no formatting to preserve and no tag allowlist to maintain.
    const sanitizedTitle = parsed.data.title
      ? DOMPurify.sanitize(parsed.data.title, { ALLOWED_TAGS: [] })
      : null;
    const sanitizedBody = parsed.data.body
      ? DOMPurify.sanitize(parsed.data.body, { ALLOWED_TAGS: [] })
      : null;

    const [created] = await db
      .insert(reviews)
      .values({
        productId: parsed.data.productId,
        userId: user.id,
        rating: parsed.data.rating,
        title: sanitizedTitle,
        body: sanitizedBody,
        photoUrls: parsed.data.photoUrls?.length ? parsed.data.photoUrls : null,
        status: "pending",
      })
      .returning();

    await writeAuditLog({
      actorUserId: user.id,
      action: "review.submitted",
      targetType: "review",
      targetId: created.id,
      metadata: { productId: parsed.data.productId },
    });

    return { ok: true };
  }
);

/** Whether the current user is eligible to review this product, and whether
 * they already have (so the PDP knows whether to show the form at all). */
export const getReviewEligibility = withAuth(
  async (
    user,
    productId: string
  ): Promise<{ eligible: boolean; alreadyReviewed: boolean }> => {
    const [eligible, existing] = await Promise.all([
      hasDeliveredOrderForProduct(user.id, productId),
      db.query.reviews.findFirst({
        where: and(
          eq(reviews.productId, productId),
          eq(reviews.userId, user.id),
          isNull(reviews.deletedAt)
        ),
      }),
    ]);
    return { eligible, alreadyReviewed: Boolean(existing) };
  }
);
