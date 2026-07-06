import "server-only";
import crypto from "node:crypto";
import { env } from "@/lib/env";
import type {
  PaymentService,
  PaymentOrderContext,
  InitiatePaymentResult,
  VerifyPaymentResult,
  WebhookResult,
} from "./types";

/**
 * JazzCash Hosted Checkout Page (HCP) integration.
 *
 * Field list and secure-hash algorithm follow JazzCash's publicly documented
 * HCP pattern (Integration Guide for Merchants v4.2, and the widely-used
 * open-source reference implementations that mirror it): sort all pp_*
 * request fields alphabetically by key, concatenate the VALUES (not
 * key=value pairs) with "&", prepend the integrity salt, then HMAC-SHA256
 * the result using the integrity salt as the key.
 *
 * IMPORTANT: JazzCash gates the complete integration PDF and a live test
 * form behind sandbox merchant signup, so this exact field list/algorithm
 * could not be byte-for-byte re-verified against a live sandbox account in
 * this environment. Verify against the founders' actual sandbox credentials
 * before going live — see PAYMENTS_TESTING.md.
 */

const JAZZCASH_HCP_URL =
  process.env.NODE_ENV === "production"
    ? "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/"
    : "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";

const JAZZCASH_INQUIRY_URL =
  process.env.NODE_ENV === "production"
    ? "https://payments.jazzcash.com.pk/ApplicationAPI/API/PaymentInquiry/Inquire"
    : "https://sandbox.jazzcash.com.pk/ApplicationAPI/API/PaymentInquiry/Inquire";

function formatJazzCashDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    String(date.getFullYear()) +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

function computeSecureHash(fields: Record<string, string>, integritySalt: string): string {
  const sortedValues = Object.keys(fields)
    .filter((key) => key !== "pp_SecureHash" && fields[key] !== undefined && fields[key] !== "")
    .sort()
    .map((key) => fields[key])
    .join("&");
  return crypto
    .createHmac("sha256", integritySalt)
    .update(`${integritySalt}&${sortedValues}`)
    .digest("hex");
}

function requireCredentials() {
  if (!env.JAZZCASH_MERCHANT_ID || !env.JAZZCASH_PASSWORD || !env.JAZZCASH_INTEGRITY_SALT) {
    throw new Error("JazzCash is not configured (JAZZCASH_MERCHANT_ID/PASSWORD/INTEGRITY_SALT).");
  }
  return {
    merchantId: env.JAZZCASH_MERCHANT_ID,
    password: env.JAZZCASH_PASSWORD,
    integritySalt: env.JAZZCASH_INTEGRITY_SALT,
  };
}

export const jazzcashPaymentService: PaymentService = {
  async initiatePayment(order: PaymentOrderContext): Promise<InitiatePaymentResult> {
    const { merchantId, password, integritySalt } = requireCredentials();
    const now = new Date();
    const expiry = new Date(now.getTime() + 60 * 60 * 1000);
    // pp_TxnRefNo must be alphanumeric — our order numbers contain a hyphen,
    // so it's stripped here; pp_BillReference carries the real order number
    // back to us untouched for webhook lookup.
    const txnRefNo = order.orderNumber.replace(/-/g, "");

    const fields: Record<string, string> = {
      pp_Version: "1.1",
      pp_TxnType: "MPAY",
      pp_Language: "EN",
      pp_MerchantID: merchantId,
      pp_Password: password,
      pp_TxnRefNo: txnRefNo,
      pp_Amount: String(Math.round(order.amount * 100)), // JazzCash amounts are in paisas
      pp_TxnCurrency: "PKR",
      pp_TxnDateTime: formatJazzCashDateTime(now),
      pp_BillReference: order.orderNumber,
      pp_Description: `Yamiriu order ${order.orderNumber}`,
      pp_TxnExpiryDateTime: formatJazzCashDateTime(expiry),
      pp_ReturnURL: `${env.NEXT_PUBLIC_APP_URL}/api/payments/jazzcash/return`,
    };

    return {
      outcome: "redirect_form",
      redirectForm: {
        actionUrl: JAZZCASH_HCP_URL,
        fields: { ...fields, pp_SecureHash: computeSecureHash(fields, integritySalt) },
      },
      providerRef: txnRefNo,
    };
  },

  async verifyPayment(ref: string): Promise<VerifyPaymentResult> {
    const { merchantId, password } = requireCredentials();
    try {
      const response = await fetch(JAZZCASH_INQUIRY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pp_MerchantID: merchantId,
          pp_Password: password,
          pp_TxnRefNo: ref,
        }),
      });
      if (!response.ok) return { verified: false, status: "pending" };
      const data = (await response.json()) as { pp_ResponseCode?: string };
      if (data.pp_ResponseCode === "000") {
        return { verified: true, status: "paid", providerRef: ref };
      }
      if (data.pp_ResponseCode) {
        return { verified: true, status: "failed", providerRef: ref };
      }
      return { verified: false, status: "pending" };
    } catch {
      return { verified: false, status: "pending" };
    }
  },

  async handleWebhook(payload: unknown): Promise<WebhookResult> {
    if (!env.JAZZCASH_INTEGRITY_SALT) {
      return { valid: false, message: "JazzCash is not configured." };
    }
    if (typeof payload !== "object" || payload === null) {
      return { valid: false, message: "Malformed JazzCash webhook payload." };
    }

    const body = payload as Record<string, string>;
    const receivedHash = body.pp_SecureHash;
    if (!receivedHash) {
      return { valid: false, message: "Missing pp_SecureHash." };
    }

    const expectedHash = computeSecureHash(body, env.JAZZCASH_INTEGRITY_SALT);
    const expectedBuf = Buffer.from(expectedHash.toLowerCase());
    const receivedBuf = Buffer.from(receivedHash.toLowerCase());
    const validHash =
      expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!validHash) {
      return { valid: false, message: "Invalid pp_SecureHash." };
    }

    if (!body.pp_BillReference || !body.pp_TxnRefNo) {
      return { valid: false, message: "Missing order reference." };
    }

    return {
      valid: true,
      orderNumber: body.pp_BillReference,
      status: body.pp_ResponseCode === "000" ? "paid" : "failed",
      providerEventId: body.pp_TxnRefNo,
      providerTransactionId: body.pp_RetreivalReferenceNo || body.pp_TxnRefNo,
    };
  },
};
