import "server-only";
import { env } from "@/lib/env";
import type {
  PaymentService,
  PaymentOrderContext,
  InitiatePaymentResult,
  VerifyPaymentResult,
  WebhookResult,
} from "./types";
import {
  buildPayfastCheckoutForm,
  verifyPayfastSignature,
  requirePayfastCredentials,
  fetchPayfastTransactionStatus,
} from "./adapters/payfast";

/**
 * Card gateway slot — currently backed by PayFast Pakistan
 * (lib/payments/adapters/payfast.ts). PRD 2.4 flags the specific PSP as a
 * pending founder decision (PayFast / HBL PayPlus / Bank Alfalah — Stripe
 * doesn't operate in Pakistan). Swapping providers later means writing a new
 * adapter file and changing the single import above — nothing else in the
 * codebase should ever import an adapter directly (PRD Rule 4).
 */
export const cardPaymentService: PaymentService = {
  async initiatePayment(order: PaymentOrderContext): Promise<InitiatePaymentResult> {
    const form = await buildPayfastCheckoutForm({
      basketId: order.orderNumber,
      amount: order.amount,
      customerEmail: order.customerEmail,
      customerMobile: order.customerPhone.replace(/[^0-9]/g, ""),
      description: `Yamiriu order ${order.orderNumber}`,
      successUrl: `${env.NEXT_PUBLIC_APP_URL}/api/payments/card-gateway/return?status=success`,
      failureUrl: `${env.NEXT_PUBLIC_APP_URL}/api/payments/card-gateway/return?status=failure`,
    });

    return {
      outcome: "redirect_form",
      redirectForm: form,
      providerRef: order.orderNumber,
    };
  },

  async verifyPayment(ref: string): Promise<VerifyPaymentResult> {
    const credentials = requirePayfastCredentials();
    const result = await fetchPayfastTransactionStatus(credentials, ref);
    if (result.status === "pending") return { verified: false, status: "pending" };
    return { verified: true, status: result.status, providerRef: result.transactionId ?? ref };
  },

  async handleWebhook(payload: unknown): Promise<WebhookResult> {
    if (!env.PAYFAST_SECURED_KEY) {
      return { valid: false, message: "PayFast is not configured." };
    }
    if (typeof payload !== "object" || payload === null) {
      return { valid: false, message: "Malformed PayFast webhook payload." };
    }
    const body = payload as Record<string, string>;
    if (!verifyPayfastSignature(body, env.PAYFAST_SECURED_KEY)) {
      return { valid: false, message: "Invalid SIGNATURE." };
    }
    if (!body.BASKET_ID) {
      return { valid: false, message: "Missing BASKET_ID." };
    }

    const success = body.TRAN_STATUS === "Paid" || body.TRAN_STATUS === "00";
    return {
      valid: true,
      orderNumber: body.BASKET_ID,
      status: success ? "paid" : "failed",
      providerEventId: body.TRAN_ID || body.BASKET_ID,
      providerTransactionId: body.TRAN_ID,
    };
  },
};
