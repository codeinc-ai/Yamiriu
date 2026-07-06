"use server";

import { z } from "zod";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { withAuth } from "@/lib/auth-guards";
import { shippingAddressSchema } from "@/lib/validations";

/**
 * Address book CRUD (PRD 4.7, 6.5). Every mutation is scoped to the calling
 * user's own rows (S-024) — the WHERE clause always includes
 * `eq(addresses.userId, user.id)`, so an id belonging to another account
 * simply matches zero rows rather than ever being editable/deletable.
 */
const addressInputSchema = shippingAddressSchema.extend({
  label: z.string().trim().max(40).optional().or(z.literal("")),
});

export interface AddressActionResult {
  ok: boolean;
  error?: string;
}

export const addAddress = withAuth(async (user, rawInput: unknown): Promise<AddressActionResult> => {
  const parsed = addressInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }

  const existing = await db
    .select({ id: addresses.id })
    .from(addresses)
    .where(and(eq(addresses.userId, user.id), isNull(addresses.deletedAt)));

  await db.insert(addresses).values({
    userId: user.id,
    label: parsed.data.label || null,
    fullName: parsed.data.fullName,
    phone: parsed.data.phone,
    addressLine1: parsed.data.addressLine1,
    addressLine2: parsed.data.addressLine2 || null,
    city: parsed.data.city,
    province: parsed.data.province,
    postalCode: parsed.data.postalCode,
    // The first address a customer saves becomes their default automatically.
    isDefault: existing.length === 0,
  });

  return { ok: true };
});

export const updateAddress = withAuth(async (user, rawInput: unknown): Promise<AddressActionResult> => {
  const parsed = addressInputSchema.extend({ id: z.string().trim().min(1) }).safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }

  const result = await db
    .update(addresses)
    .set({
      label: parsed.data.label || null,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      addressLine1: parsed.data.addressLine1,
      addressLine2: parsed.data.addressLine2 || null,
      city: parsed.data.city,
      province: parsed.data.province,
      postalCode: parsed.data.postalCode,
    })
    .where(and(eq(addresses.id, parsed.data.id), eq(addresses.userId, user.id), isNull(addresses.deletedAt)))
    .returning();

  if (result.length === 0) {
    return { ok: false, error: "That address could not be found." };
  }
  return { ok: true };
});

export const deleteAddress = withAuth(async (user, rawInput: unknown): Promise<AddressActionResult> => {
  const parsed = z.object({ id: z.string().trim().min(1) }).safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const [deleted] = await db
    .update(addresses)
    .set({ deletedAt: new Date() })
    .where(and(eq(addresses.id, parsed.data.id), eq(addresses.userId, user.id), isNull(addresses.deletedAt)))
    .returning();

  if (!deleted) {
    return { ok: false, error: "That address could not be found." };
  }

  if (deleted.isDefault) {
    const [next] = await db
      .select({ id: addresses.id })
      .from(addresses)
      .where(and(eq(addresses.userId, user.id), isNull(addresses.deletedAt)))
      .orderBy(desc(addresses.createdAt))
      .limit(1);
    if (next) {
      await db.update(addresses).set({ isDefault: true }).where(eq(addresses.id, next.id));
    }
  }

  return { ok: true };
});

export const setDefaultAddress = withAuth(async (user, rawInput: unknown): Promise<AddressActionResult> => {
  const parsed = z.object({ id: z.string().trim().min(1) }).safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const [target] = await db
    .select({ id: addresses.id })
    .from(addresses)
    .where(and(eq(addresses.id, parsed.data.id), eq(addresses.userId, user.id), isNull(addresses.deletedAt)));
  if (!target) {
    return { ok: false, error: "That address could not be found." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(addresses)
      .set({ isDefault: false })
      .where(and(eq(addresses.userId, user.id), eq(addresses.isDefault, true)));
    await tx.update(addresses).set({ isDefault: true }).where(eq(addresses.id, parsed.data.id));
  });

  return { ok: true };
});
