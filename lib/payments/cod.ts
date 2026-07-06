import type {
  PaymentService,
  InitiatePaymentResult,
  VerifyPaymentResult,
  WebhookResult,
} from "./types";

/**
 * Cash on Delivery — no payment step at all. The order is confirmed
 * immediately (or held for review if the COD fraud check flags it — see
 * actions/checkout.ts), and payment is collected by the courier on delivery.
 */
export const codPaymentService: PaymentService = {
  async initiatePayment(): Promise<InitiatePaymentResult> {
    return { outcome: "immediate" };
  },

  async verifyPayment(): Promise<VerifyPaymentResult> {
    return { verified: false, status: "pending" };
  },

  async handleWebhook(): Promise<WebhookResult> {
    return { valid: false, message: "Cash on Delivery has no webhook." };
  },
};
