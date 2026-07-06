import "server-only";
import { db } from "@/db";
import { courierWebhookEvents, type courierProviderEnum } from "@/db/schema";

type CourierProvider = (typeof courierProviderEnum.enumValues)[number];

/** Same atomic ON CONFLICT DO NOTHING pattern as lib/payments/webhook-idempotency.ts,
 * scoped to the courier_webhook_events table (S-017). */
export async function claimCourierWebhookEvent(
  provider: CourierProvider,
  providerEventId: string,
  orderId?: string
): Promise<boolean> {
  const [inserted] = await db
    .insert(courierWebhookEvents)
    .values({ id: `${provider}:${providerEventId}`, provider, orderId })
    .onConflictDoNothing()
    .returning();
  return Boolean(inserted);
}
