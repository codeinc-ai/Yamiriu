import "server-only";
import { db } from "@/db";
import { webhookEvents, type paymentProviderEnum } from "@/db/schema";

type PaymentProvider = (typeof paymentProviderEnum.enumValues)[number];

/**
 * Atomically records a webhook event as processed (S-017). `id` is
 * deterministic (`${provider}:${providerEventId}`), so a duplicate delivery
 * collides on the primary key via ON CONFLICT DO NOTHING — no read-then-write
 * race window between two concurrent deliveries of the same event.
 *
 * Returns true the first time an event is claimed; false if it was already
 * recorded, meaning the caller must skip reprocessing (but still return a
 * success response to the provider — it's not an error, just a duplicate).
 */
export async function claimWebhookEvent(
  provider: PaymentProvider,
  providerEventId: string,
  orderId?: string
): Promise<boolean> {
  const [inserted] = await db
    .insert(webhookEvents)
    .values({ id: `${provider}:${providerEventId}`, provider, orderId })
    .onConflictDoNothing()
    .returning();
  return Boolean(inserted);
}
