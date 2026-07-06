"use server";

import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { wishlists } from "@/db/schema";
import { withAuth, getCurrentUser } from "@/lib/auth-guards";

const productIdSchema = z.object({ productId: z.string().min(1) });

export interface WishlistActionResult {
  ok: boolean;
  error?: string;
}

/** Any authenticated user may manage their own wishlist (Rule 12 double-check;
 * proxy.ts doesn't gate this — it's a Server Action, so withAuth is the only
 * enforcement point, which is correct and sufficient here). */
export const addToWishlist = withAuth(
  async (user, input: unknown): Promise<WishlistActionResult> => {
    const parsed = productIdSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid product." };

    try {
      await db
        .insert(wishlists)
        .values({ userId: user.id, productId: parsed.data.productId })
        .onConflictDoNothing({ target: [wishlists.userId, wishlists.productId] });
      return { ok: true };
    } catch {
      return { ok: false, error: "Couldn't save this item. Please try again." };
    }
  }
);

// Wishlist rows are hard-deleted on remove (not soft-deleted like most tables):
// it's a low-stakes toggle, not an auditable record, and the (userId,
// productId) unique constraint isn't partial — a soft-deleted row would block
// re-adding the same product later.
export const removeFromWishlist = withAuth(
  async (user, input: unknown): Promise<WishlistActionResult> => {
    const parsed = productIdSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid product." };

    await db
      .delete(wishlists)
      .where(
        and(
          eq(wishlists.userId, user.id),
          eq(wishlists.productId, parsed.data.productId)
        )
      );
    return { ok: true };
  }
);

/** Current user's wishlisted product ids, or [] for guests. Used to hydrate
 * the client store server-side (no client fetch needed). */
export async function getWishlistProductIds(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const rows = await db
    .select({ productId: wishlists.productId })
    .from(wishlists)
    .where(and(eq(wishlists.userId, user.id), isNull(wishlists.deletedAt)));

  return rows.map((r) => r.productId);
}
