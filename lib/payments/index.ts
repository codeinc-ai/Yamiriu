import type { PaymentMethod, PaymentService } from "./types";
import { jazzcashPaymentService } from "./jazzcash";
import { easypaisaPaymentService } from "./easypaisa";
import { cardPaymentService } from "./card";
import { bankTransferPaymentService } from "./bank-transfer";
import { codPaymentService } from "./cod";

export type {
  PaymentMethod,
  PaymentService,
  PaymentOrderContext,
  RedirectFormSpec,
  InitiatePaymentResult,
  VerifyPaymentResult,
  WebhookResult,
} from "./types";
export { claimWebhookEvent } from "./webhook-idempotency";

const REGISTRY: Record<PaymentMethod, PaymentService> = {
  jazzcash: jazzcashPaymentService,
  easypaisa: easypaisaPaymentService,
  card: cardPaymentService,
  bank_transfer: bankTransferPaymentService,
  cod: codPaymentService,
};

/**
 * Single entry point for all payment-provider interaction (PRD Rule 4 — no
 * provider-specific code should exist outside lib/payments/*).
 */
export function getPaymentService(method: PaymentMethod): PaymentService {
  return REGISTRY[method];
}
