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
 * Easypaisa (Easypay) Hosted Checkout integration.
 *
 * Request signing follows the Easypaisa Merchant Integration Guide (v4.1.2),
 * section 3.3 (`merchantHashedReq`): build a "key=value&..." string from the
 * request fields sorted alphabetically by key, then encrypt it with
 * AES/ECB/PKCS5Padding using the merchant's hash key.
 *
 * IMPORTANT: available documentation for the postBackURL callback shows
 * plain fields (status/desc/orderRefNum/transactionId) with no merchant-
 * verifiable signature on the response side — unlike JazzCash, there's no
 * confirmed `pp_SecureHash`-equivalent to check on the way back. Rather than
 * trust an unverifiable postback, `handleWebhook` treats it as advisory only
 * and independently re-confirms the transaction via a server-to-server
 * inquiry call (`verifyPayment`) before ever accepting it — a forged
 * postback body can't produce a matching inquiry result. Confirm the exact
 * inquiry endpoint against the founders' merchant portal docs before going
 * live; see PAYMENTS_TESTING.md.
 */

const EASYPAISA_CHECKOUT_URL =
  process.env.NODE_ENV === "production"
    ? "https://easypay.easypaisa.com.pk/easypay/Index.jsf"
    : "https://easypaystg.easypaisa.com.pk/easypay/Index.jsf";

const EASYPAISA_INQUIRY_URL =
  process.env.NODE_ENV === "production"
    ? "https://easypay.easypaisa.com.pk/easypay-service/rest/v4/inquire"
    : "https://easypaystg.easypaisa.com.pk/easypay-service/rest/v4/inquire";

function requireCredentials() {
  if (!env.EASYPAISA_STORE_ID || !env.EASYPAISA_HASH_KEY) {
    throw new Error("Easypaisa is not configured (EASYPAISA_STORE_ID/HASH_KEY).");
  }
  return { storeId: env.EASYPAISA_STORE_ID, hashKey: env.EASYPAISA_HASH_KEY };
}

// AES-256 needs a 32-byte key; hash keys issued via the merchant portal
// aren't guaranteed to already be exactly 32 bytes, so one is derived
// deterministically via SHA-256 (same input always yields the same key).
function deriveAesKey(hashKey: string): Buffer {
  return crypto.createHash("sha256").update(hashKey).digest();
}

function encryptFields(fields: Record<string, string>, hashKey: string): string {
  const ordered = Object.keys(fields)
    .filter((key) => fields[key] !== undefined && fields[key] !== "")
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("&");
  const cipher = crypto.createCipheriv("aes-256-ecb", deriveAesKey(hashKey), null);
  return Buffer.concat([cipher.update(ordered, "utf8"), cipher.final()]).toString("base64");
}

function formatExpiry(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function normalizePakMobile(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("92") && digits.length === 12) return `0${digits.slice(2)}`;
  return digits;
}

export const easypaisaPaymentService: PaymentService = {
  async initiatePayment(order: PaymentOrderContext): Promise<InitiatePaymentResult> {
    const { storeId, hashKey } = requireCredentials();
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    const fields: Record<string, string> = {
      storeId,
      amount: order.amount.toFixed(2),
      postBackURL: `${env.NEXT_PUBLIC_APP_URL}/api/payments/easypaisa/return`,
      orderRefNum: order.orderNumber,
      expiryDate: formatExpiry(expiry),
      autoRedirect: "1",
      emailAddr: order.customerEmail,
      mobileNum: normalizePakMobile(order.customerPhone),
    };

    return {
      outcome: "redirect_form",
      redirectForm: {
        actionUrl: EASYPAISA_CHECKOUT_URL,
        fields: { ...fields, merchantHashedReq: encryptFields(fields, hashKey) },
      },
      providerRef: order.orderNumber,
    };
  },

  async verifyPayment(ref: string): Promise<VerifyPaymentResult> {
    const { storeId, hashKey } = requireCredentials();
    try {
      const fields = { orderRefNum: ref, storeId };
      const response = await fetch(EASYPAISA_INQUIRY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, merchantHashedReq: encryptFields(fields, hashKey) }),
      });
      if (!response.ok) return { verified: false, status: "pending" };
      const data = (await response.json()) as { responseCode?: string; status?: string };
      if (data.responseCode === "0000" || data.status === "Success") {
        return { verified: true, status: "paid", providerRef: ref };
      }
      if (data.responseCode || data.status) {
        return { verified: true, status: "failed", providerRef: ref };
      }
      return { verified: false, status: "pending" };
    } catch {
      return { verified: false, status: "pending" };
    }
  },

  async handleWebhook(payload: unknown): Promise<WebhookResult> {
    if (typeof payload !== "object" || payload === null) {
      return { valid: false, message: "Malformed Easypaisa postback." };
    }
    const body = payload as Record<string, string>;
    if (!body.orderRefNum) {
      return { valid: false, message: "Missing orderRefNum." };
    }

    const inquiry = await easypaisaPaymentService.verifyPayment(body.orderRefNum);
    if (!inquiry.verified) {
      return { valid: false, message: "Could not independently verify transaction status." };
    }

    return {
      valid: true,
      orderNumber: body.orderRefNum,
      status: inquiry.status === "paid" ? "paid" : "failed",
      providerEventId: body.transactionId || `${body.orderRefNum}:${body.desc ?? body.status ?? ""}`,
      providerTransactionId: body.transactionId,
    };
  },
};
