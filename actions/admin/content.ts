"use server";

import { revalidatePath } from "next/cache";
import DOMPurify from "isomorphic-dompurify";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { banners, lookbookEntries, journalPosts } from "@/db/schema";
import { withPermission } from "@/lib/auth-guards";
import { writeAuditLog } from "@/lib/audit";
import { bannerFormSchema, lookbookFormSchema, journalFormSchema } from "@/lib/validations";

export interface AdminContentActionResult {
  ok: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

export const createBanner = withPermission(
  "content:write",
  async (actor, rawInput: unknown): Promise<AdminContentActionResult> => {
    const parsed = bannerFormSchema.safeParse(rawInput);
    if (!parsed.success) return { ok: false, error: "Please check the form and try again." };
    const input = parsed.data;

    const [created] = await db
      .insert(banners)
      .values({
        imageUrl: input.imageUrl,
        linkUrl: input.linkUrl || null,
        title: input.title || null,
        active: input.active,
        sortOrder: input.sortOrder,
      })
      .returning();

    await writeAuditLog({ actorUserId: actor.id, action: "content.created", targetType: "banner", targetId: created.id });
    revalidatePath("/admin/content");
    revalidatePath("/");
    return { ok: true };
  }
);

export const updateBanner = withPermission(
  "content:write",
  async (actor, rawInput: unknown): Promise<AdminContentActionResult> => {
    const parsed = bannerFormSchema.safeParse(rawInput);
    if (!parsed.success || !parsed.data.id) return { ok: false, error: "Please check the form and try again." };
    const input = parsed.data;
    const id = input.id!;

    const existing = await db.query.banners.findFirst({ where: and(eq(banners.id, id), isNull(banners.deletedAt)) });
    if (!existing) return { ok: false, error: "Banner not found." };

    await db
      .update(banners)
      .set({
        imageUrl: input.imageUrl,
        linkUrl: input.linkUrl || null,
        title: input.title || null,
        active: input.active,
        sortOrder: input.sortOrder,
      })
      .where(eq(banners.id, id));

    await writeAuditLog({ actorUserId: actor.id, action: "content.updated", targetType: "banner", targetId: id });
    revalidatePath("/admin/content");
    revalidatePath("/");
    return { ok: true };
  }
);

export const deleteBanner = withPermission(
  "content:write",
  async (actor, id: string): Promise<AdminContentActionResult> => {
    const existing = await db.query.banners.findFirst({ where: and(eq(banners.id, id), isNull(banners.deletedAt)) });
    if (!existing) return { ok: false, error: "Banner not found." };

    await db.update(banners).set({ deletedAt: new Date() }).where(eq(banners.id, id));

    await writeAuditLog({ actorUserId: actor.id, action: "content.deleted", targetType: "banner", targetId: id });
    revalidatePath("/admin/content");
    revalidatePath("/");
    return { ok: true };
  }
);

// ---------------------------------------------------------------------------
// Lookbook entries
// ---------------------------------------------------------------------------

async function assertLookbookSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await db.query.lookbookEntries.findFirst({
    where: and(eq(lookbookEntries.slug, slug), isNull(lookbookEntries.deletedAt)),
  });
  return !existing || existing.id === excludeId;
}

export const createLookbookEntry = withPermission(
  "content:write",
  async (actor, rawInput: unknown): Promise<AdminContentActionResult> => {
    const parsed = lookbookFormSchema.safeParse(rawInput);
    if (!parsed.success) return { ok: false, error: "Please check the form and try again." };
    const input = parsed.data;
    if (!(await assertLookbookSlugAvailable(input.slug))) {
      return { ok: false, error: "That slug is already in use." };
    }

    const [created] = await db
      .insert(lookbookEntries)
      .values({
        slug: input.slug,
        title: input.title,
        description: input.description || null,
        imageUrl: input.imageUrl,
        relatedProductIds: input.relatedProductIds?.length ? input.relatedProductIds : null,
        published: input.published,
      })
      .returning();

    await writeAuditLog({ actorUserId: actor.id, action: "content.created", targetType: "lookbook_entry", targetId: created.id });
    revalidatePath("/admin/content");
    return { ok: true };
  }
);

export const updateLookbookEntry = withPermission(
  "content:write",
  async (actor, rawInput: unknown): Promise<AdminContentActionResult> => {
    const parsed = lookbookFormSchema.safeParse(rawInput);
    if (!parsed.success || !parsed.data.id) return { ok: false, error: "Please check the form and try again." };
    const input = parsed.data;
    const id = input.id!;

    const existing = await db.query.lookbookEntries.findFirst({
      where: and(eq(lookbookEntries.id, id), isNull(lookbookEntries.deletedAt)),
    });
    if (!existing) return { ok: false, error: "Lookbook entry not found." };
    if (!(await assertLookbookSlugAvailable(input.slug, id))) {
      return { ok: false, error: "That slug is already in use." };
    }

    await db
      .update(lookbookEntries)
      .set({
        slug: input.slug,
        title: input.title,
        description: input.description || null,
        imageUrl: input.imageUrl,
        relatedProductIds: input.relatedProductIds?.length ? input.relatedProductIds : null,
        published: input.published,
      })
      .where(eq(lookbookEntries.id, id));

    await writeAuditLog({ actorUserId: actor.id, action: "content.updated", targetType: "lookbook_entry", targetId: id });
    revalidatePath("/admin/content");
    return { ok: true };
  }
);

export const deleteLookbookEntry = withPermission(
  "content:write",
  async (actor, id: string): Promise<AdminContentActionResult> => {
    const existing = await db.query.lookbookEntries.findFirst({
      where: and(eq(lookbookEntries.id, id), isNull(lookbookEntries.deletedAt)),
    });
    if (!existing) return { ok: false, error: "Lookbook entry not found." };

    await db.update(lookbookEntries).set({ deletedAt: new Date() }).where(eq(lookbookEntries.id, id));

    await writeAuditLog({ actorUserId: actor.id, action: "content.deleted", targetType: "lookbook_entry", targetId: id });
    revalidatePath("/admin/content");
    return { ok: true };
  }
);

// ---------------------------------------------------------------------------
// Journal posts
// ---------------------------------------------------------------------------

function sanitizeJournalContent(raw: string): string {
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "b", "i", "ul", "ol", "li", "a", "h2", "h3", "blockquote"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}

async function assertJournalSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await db.query.journalPosts.findFirst({
    where: and(eq(journalPosts.slug, slug), isNull(journalPosts.deletedAt)),
  });
  return !existing || existing.id === excludeId;
}

export const createJournalPost = withPermission(
  "content:write",
  async (actor, rawInput: unknown): Promise<AdminContentActionResult> => {
    const parsed = journalFormSchema.safeParse(rawInput);
    if (!parsed.success) return { ok: false, error: "Please check the form and try again." };
    const input = parsed.data;
    if (!(await assertJournalSlugAvailable(input.slug))) {
      return { ok: false, error: "That slug is already in use." };
    }

    const [created] = await db
      .insert(journalPosts)
      .values({
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt || null,
        content: sanitizeJournalContent(input.content),
        coverImageUrl: input.coverImageUrl || null,
        authorId: actor.id,
        category: input.category || null,
        published: input.published,
        publishedAt: input.published ? new Date() : null,
      })
      .returning();

    await writeAuditLog({ actorUserId: actor.id, action: "content.created", targetType: "journal_post", targetId: created.id });
    revalidatePath("/admin/content");
    return { ok: true };
  }
);

export const updateJournalPost = withPermission(
  "content:write",
  async (actor, rawInput: unknown): Promise<AdminContentActionResult> => {
    const parsed = journalFormSchema.safeParse(rawInput);
    if (!parsed.success || !parsed.data.id) return { ok: false, error: "Please check the form and try again." };
    const input = parsed.data;
    const id = input.id!;

    const existing = await db.query.journalPosts.findFirst({
      where: and(eq(journalPosts.id, id), isNull(journalPosts.deletedAt)),
    });
    if (!existing) return { ok: false, error: "Journal post not found." };
    if (!(await assertJournalSlugAvailable(input.slug, id))) {
      return { ok: false, error: "That slug is already in use." };
    }

    await db
      .update(journalPosts)
      .set({
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt || null,
        content: sanitizeJournalContent(input.content),
        coverImageUrl: input.coverImageUrl || null,
        category: input.category || null,
        published: input.published,
        publishedAt: input.published && !existing.publishedAt ? new Date() : existing.publishedAt,
      })
      .where(eq(journalPosts.id, id));

    await writeAuditLog({ actorUserId: actor.id, action: "content.updated", targetType: "journal_post", targetId: id });
    revalidatePath("/admin/content");
    return { ok: true };
  }
);

export const deleteJournalPost = withPermission(
  "content:write",
  async (actor, id: string): Promise<AdminContentActionResult> => {
    const existing = await db.query.journalPosts.findFirst({
      where: and(eq(journalPosts.id, id), isNull(journalPosts.deletedAt)),
    });
    if (!existing) return { ok: false, error: "Journal post not found." };

    await db.update(journalPosts).set({ deletedAt: new Date() }).where(eq(journalPosts.id, id));

    await writeAuditLog({ actorUserId: actor.id, action: "content.deleted", targetType: "journal_post", targetId: id });
    revalidatePath("/admin/content");
    return { ok: true };
  }
);
