"use server";

import { revalidatePath } from "next/cache";
import DOMPurify from "isomorphic-dompurify";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { withPermission } from "@/lib/auth-guards";
import { writeAuditLog } from "@/lib/audit";
import { productFormSchema, type ProductFormInput } from "@/lib/validations";

export interface AdminProductActionResult {
  ok: boolean;
  error?: string;
  productId?: string;
}

/** Rich-text description sanitization (PRD 4.8.3, S-011) — a small safe
 * allowlist (unlike reviews' plain-text strip) since this is meant to
 * support real formatting, not just free text. */
function sanitizeDescription(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "b", "i", "ul", "ol", "li", "a"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}

async function assertSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), isNull(products.deletedAt)),
  });
  return !existing || existing.id === excludeId;
}

/** Replaces a product's variant matrix inside the same transaction as the
 * product write: existing rows not present in `variants` are soft-deleted,
 * matched rows (by id) are updated, and unmatched input rows are inserted. */
async function syncVariants(
  tx: Pick<typeof db, "select" | "update" | "insert">,
  productId: string,
  variants: ProductFormInput["variants"]
): Promise<void> {
  const incoming = variants ?? [];
  const existing = await tx
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(and(eq(productVariants.productId, productId), isNull(productVariants.deletedAt)));

  const incomingIds = new Set(incoming.filter((v) => v.id).map((v) => v.id));
  const toRemove = existing.filter((row) => !incomingIds.has(row.id)).map((row) => row.id);
  if (toRemove.length > 0) {
    await tx
      .update(productVariants)
      .set({ deletedAt: new Date() })
      .where(inArray(productVariants.id, toRemove));
  }

  for (const variant of incoming) {
    if (variant.id) {
      await tx
        .update(productVariants)
        .set({ size: variant.size, color: variant.color, stock: variant.stock, sku: variant.sku })
        .where(eq(productVariants.id, variant.id));
    } else {
      await tx.insert(productVariants).values({
        productId,
        size: variant.size,
        color: variant.color,
        stock: variant.stock,
        sku: variant.sku,
      });
    }
  }
}

export const createProduct = withPermission(
  "products:write",
  async (actor, rawInput: unknown): Promise<AdminProductActionResult> => {
    const parsed = productFormSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { ok: false, error: "Please check the form and try again." };
    }
    const input = parsed.data;

    if (!(await assertSlugAvailable(input.slug))) {
      return { ok: false, error: "That slug is already in use." };
    }

    try {
      const productId = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(products)
          .values({
            name: input.name,
            slug: input.slug,
            description: sanitizeDescription(input.description),
            price: String(input.price),
            category: input.category,
            itemType: input.itemType || undefined,
            images: input.images?.length ? input.images : null,
            hasModel: input.hasModel,
            modelUrl: input.modelUrl || null,
            published: input.published,
          })
          .returning();

        await syncVariants(tx, created.id, input.variants);
        return created.id;
      });

      await writeAuditLog({
        actorUserId: actor.id,
        action: "product.created",
        targetType: "product",
        targetId: productId,
        metadata: { slug: input.slug },
      });

      revalidatePath("/admin/products");
      return { ok: true, productId };
    } catch {
      return { ok: false, error: "Couldn't save the product. Please try again." };
    }
  }
);

export const updateProduct = withPermission(
  "products:write",
  async (actor, rawInput: unknown): Promise<AdminProductActionResult> => {
    const parsed = productFormSchema.safeParse(rawInput);
    if (!parsed.success || !parsed.data.id) {
      return { ok: false, error: "Please check the form and try again." };
    }
    const input = parsed.data;
    const productId = input.id!;

    const existing = await db.query.products.findFirst({
      where: and(eq(products.id, productId), isNull(products.deletedAt)),
    });
    if (!existing) {
      return { ok: false, error: "Product not found." };
    }
    if (!(await assertSlugAvailable(input.slug, productId))) {
      return { ok: false, error: "That slug is already in use." };
    }

    try {
      await db.transaction(async (tx) => {
        await tx
          .update(products)
          .set({
            name: input.name,
            slug: input.slug,
            description: sanitizeDescription(input.description),
            price: String(input.price),
            category: input.category,
            itemType: input.itemType || undefined,
            images: input.images?.length ? input.images : null,
            hasModel: input.hasModel,
            modelUrl: input.modelUrl || null,
            published: input.published,
          })
          .where(eq(products.id, productId));

        await syncVariants(tx, productId, input.variants);
      });

      await writeAuditLog({
        actorUserId: actor.id,
        action: "product.updated",
        targetType: "product",
        targetId: productId,
        metadata: { slug: input.slug },
      });

      revalidatePath("/admin/products");
      revalidatePath(`/product/${input.slug}`);
      return { ok: true, productId };
    } catch {
      return { ok: false, error: "Couldn't save the product. Please try again." };
    }
  }
);

export const softDeleteProduct = withPermission(
  "products:write",
  async (actor, productId: string): Promise<AdminProductActionResult> => {
    const existing = await db.query.products.findFirst({
      where: and(eq(products.id, productId), isNull(products.deletedAt)),
    });
    if (!existing) {
      return { ok: false, error: "Product not found." };
    }

    await db.update(products).set({ deletedAt: new Date() }).where(eq(products.id, productId));

    await writeAuditLog({
      actorUserId: actor.id,
      action: "product.deleted",
      targetType: "product",
      targetId: productId,
    });

    revalidatePath("/admin/products");
    return { ok: true, productId };
  }
);

export const bulkSetProductsPublished = withPermission(
  "products:write",
  async (
    actor,
    input: { productIds: string[]; published: boolean }
  ): Promise<{ ok: boolean; error?: string; count?: number }> => {
    if (!Array.isArray(input.productIds) || input.productIds.length === 0) {
      return { ok: false, error: "No products selected." };
    }

    await db
      .update(products)
      .set({ published: input.published })
      .where(and(inArray(products.id, input.productIds), isNull(products.deletedAt)));

    await writeAuditLog({
      actorUserId: actor.id,
      action: "product.updated",
      targetType: "product",
      metadata: { bulk: true, count: input.productIds.length, published: input.published },
    });

    revalidatePath("/admin/products");
    return { ok: true, count: input.productIds.length };
  }
);
