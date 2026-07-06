import "server-only";
import crypto from "node:crypto";
import { env } from "@/lib/env";

/**
 * PayFast Pakistan (apps.net.pk) adapter — the currently-selected provider
 * behind the generic `card` payment-method slot (see ../card.ts). PRD 2.4
 * flags the specific card PSP as a pending founder decision (PayFast / HBL
 * PayPlus / Bank Alfalah); swapping providers later means writing a new
 * adapter file here and repointing card.ts's single import at it — nothing
 * outside card.ts should ever import from this file (PRD Rule 4).
 *
 * IMPORTANT: PayFast Pakistan gates its full API reference behind merchant
 * portal signup (gopayfast.com/docs returned 403 to an unauthenticated
 * fetch during research). The two-step GetAccessToken → PostTransaction flow
 * and field names below follow the publicly documented integration shape;
 * the SIGNATURE algorithm is a best-effort HMAC-SHA256 mirroring PayFast's
 * generally documented signing pattern (sorted, concatenated fields). Confirm
 * both against the founders' actual sandbox docs before going live — see
 * PAYMENTS_TESTING.md.
 */

const PAYFAST_BASE_URL =
  process.env.NODE_ENV === "production" ? "https://ipg1.apps.net.pk" : "https://ipguat.apps.net.pk";

const GET_ACCESS_TOKEN_URL = `${PAYFAST_BASE_URL}/Ecommerce/api/Transaction/GetAccessToken`;
const POST_TRANSACTION_URL = `${PAYFAST_BASE_URL}/Ecommerce/api/Transaction/PostTransaction`;
// Endpoint name unconfirmed against official docs (see file header) — used
// only by verifyPayment's best-effort status inquiry.
const TRANSACTION_STATUS_URL = `${PAYFAST_BASE_URL}/Ecommerce/api/Transaction/GetTransactionStatus`;

export interface PayfastCredentials {
  merchantId: string;
  securedKey: string;
}

export function requirePayfastCredentials(): PayfastCredentials {
  if (!env.PAYFAST_MERCHANT_ID || !env.PAYFAST_SECURED_KEY) {
    throw new Error("PayFast is not configured (PAYFAST_MERCHANT_ID/SECURED_KEY).");
  }
  return { merchantId: env.PAYFAST_MERCHANT_ID, securedKey: env.PAYFAST_SECURED_KEY };
}

function computeSignature(fields: Record<string, string>, securedKey: string): string {
  const sortedPairs = Object.keys(fields)
    .filter((key) => key !== "SIGNATURE" && fields[key] !== undefined && fields[key] !== "")
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("&");
  return crypto.createHmac("sha256", securedKey).update(sortedPairs).digest("hex");
}

export interface PayfastCheckoutRequest {
  basketId: string;
  amount: number;
  customerEmail: string;
  customerMobile: string;
  description: string;
  successUrl: string;
  failureUrl: string;
}

export interface PayfastCheckoutForm {
  actionUrl: string;
  fields: Record<string, string>;
}

async function fetchAccessToken(
  credentials: PayfastCredentials,
  basketId: string,
  amount: number
): Promise<string> {
  const response = await fetch(GET_ACCESS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      MERCHANT_ID: credentials.merchantId,
      SECURED_KEY: credentials.securedKey,
      BASKET_ID: basketId,
      TXNAMT: amount.toFixed(2),
      CURRENCY_CODE: "PKR",
    }),
  });
  if (!response.ok) {
    throw new Error(`PayFast GetAccessToken failed with status ${response.status}`);
  }
  const data = (await response.json()) as { ACCESS_TOKEN?: string };
  if (!data.ACCESS_TOKEN) {
    throw new Error("PayFast GetAccessToken response missing ACCESS_TOKEN.");
  }
  return data.ACCESS_TOKEN;
}

export async function buildPayfastCheckoutForm(
  request: PayfastCheckoutRequest
): Promise<PayfastCheckoutForm> {
  const credentials = requirePayfastCredentials();
  const token = await fetchAccessToken(credentials, request.basketId, request.amount);

  const fields: Record<string, string> = {
    MERCHANT_ID: credentials.merchantId,
    TOKEN: token,
    PROCCODE: "00",
    TXNAMT: request.amount.toFixed(2),
    CUSTOMER_MOBILE_NO: request.customerMobile,
    CUSTOMER_EMAIL_ADDRESS: request.customerEmail,
    VERSION: "MERCHANT-CART-0.1",
    TXNDESC: request.description,
    SUCCESS_URL: request.successUrl,
    FAILURE_URL: request.failureUrl,
    BASKET_ID: request.basketId,
    ORDER_DATE: new Date().toISOString(),
    CURRENCY_CODE: "PKR",
  };

  return {
    actionUrl: POST_TRANSACTION_URL,
    fields: { ...fields, SIGNATURE: computeSignature(fields, credentials.securedKey) },
  };
}

export function verifyPayfastSignature(payload: Record<string, string>, securedKey: string): boolean {
  const received = payload.SIGNATURE;
  if (!received) return false;
  const expected = computeSignature(payload, securedKey);
  const expectedBuf = Buffer.from(expected.toLowerCase());
  const receivedBuf = Buffer.from(received.toLowerCase());
  return expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

export async function fetchPayfastTransactionStatus(
  credentials: PayfastCredentials,
  basketId: string
): Promise<{ status: "paid" | "failed" | "pending"; transactionId?: string }> {
  try {
    const response = await fetch(TRANSACTION_STATUS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ MERCHANT_ID: credentials.merchantId, BASKET_ID: basketId }),
    });
    if (!response.ok) return { status: "pending" };
    const data = (await response.json()) as { TRAN_STATUS?: string; TRAN_ID?: string };
    if (data.TRAN_STATUS === "Paid" || data.TRAN_STATUS === "00") {
      return { status: "paid", transactionId: data.TRAN_ID };
    }
    if (data.TRAN_STATUS) return { status: "failed", transactionId: data.TRAN_ID };
    return { status: "pending" };
  } catch {
    return { status: "pending" };
  }
}
