import type {
  PaymentService,
  InitiatePaymentResult,
  VerifyPaymentResult,
  WebhookResult,
} from "./types";

/**
 * Bank transfer — no online step. The order is created as "pending_payment"
 * and an admin manually confirms once the transfer appears in the bank
 * statement (PRD WF-007). There is no webhook for this method.
 */
export const bankTransferPaymentService: PaymentService = {
  async initiatePayment(): Promise<InitiatePaymentResult> {
    return { outcome: "manual" };
  },

  async verifyPayment(): Promise<VerifyPaymentResult> {
    return { verified: false, status: "pending" };
  },

  async handleWebhook(): Promise<WebhookResult> {
    return { valid: false, message: "Bank transfer has no webhook — confirmed manually by an admin." };
  },
};
