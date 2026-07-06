import type { paymentMethodEnum } from "@/db/schema";

export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];

/** Everything a payment provider needs to initiate a charge. Deliberately
 * minimal — no PII beyond what's needed to reconcile with the provider (S-023). */
export interface PaymentOrderContext {
  orderId: string;
  orderNumber: string;
  amount: number; // PKR
  customerEmail: string;
  customerPhone: string;
}

/** A signed, provider-specific hosted-checkout form the browser must
 * auto-submit via POST — these gateways require a signed form body, so a
 * plain GET redirect Location header can't carry it. */
export interface RedirectFormSpec {
  actionUrl: string;
  fields: Record<string, string>;
}

export interface InitiatePaymentResult {
  /**
   * "redirect_form": the browser must auto-submit `redirectForm` to the
   *                  provider's hosted checkout page (JazzCash/Easypaisa/Card).
   * "manual":        no online step; the customer sees instructions and an
   *                  admin confirms later (bank transfer).
   * "immediate":     no payment step at all (COD).
   */
  outcome: "redirect_form" | "manual" | "immediate";
  redirectForm?: RedirectFormSpec;
  /** Provider-side reference to reconcile against later (webhook/verify). */
  providerRef?: string;
}

export interface VerifyPaymentResult {
  verified: boolean;
  status: "paid" | "failed" | "pending";
  providerRef?: string;
}

export interface WebhookResult {
  /** False if the signature didn't check out — caller must reject with 401. */
  valid: boolean;
  /** Our order number, extracted from the (now-verified) payload. */
  orderNumber?: string;
  status?: "paid" | "failed";
  /** Idempotency key unique to this event — caller dedupes on this before
   * acting on the webhook (S-017). */
  providerEventId?: string;
  /** The gateway's own transaction id, stored on the order for reconciliation. */
  providerTransactionId?: string;
  message?: string;
}

/**
 * Common interface every payment provider implements (PRD Rule 4 — all
 * provider-specific code lives only in lib/payments/*).
 */
export interface PaymentService {
  initiatePayment(order: PaymentOrderContext): Promise<InitiatePaymentResult>;
  verifyPayment(ref: string): Promise<VerifyPaymentResult>;
  handleWebhook(payload: unknown, signature: string | null): Promise<WebhookResult>;
}
