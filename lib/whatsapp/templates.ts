import type { WhatsAppTemplateInput } from "./types";

/**
 * Template builders for the 4 order-lifecycle notifications (PRD 2.5, Batch
 * 4). Each `name` must exist as an APPROVED template in Meta Business
 * Manager under these exact names before sending will succeed — this module
 * only builds the invocation payload, it doesn't create/manage templates.
 */

export function orderConfirmationTemplate(input: {
  customerName: string;
  orderNumber: string;
  totalFormatted: string;
}): WhatsAppTemplateInput {
  return {
    name: "order_confirmation",
    bodyParams: [input.customerName, input.orderNumber, input.totalFormatted],
  };
}

export function orderShippedTemplate(input: {
  orderNumber: string;
  trackingNumber: string;
}): WhatsAppTemplateInput {
  return {
    name: "order_shipped",
    bodyParams: [input.orderNumber, input.trackingNumber],
    // Template's URL button is defined as https://{domain}/track-order/{{1}}
    // at creation time — only the dynamic suffix is sent here.
    buttonUrlParam: input.orderNumber,
  };
}

export function orderDeliveredTemplate(input: { orderNumber: string }): WhatsAppTemplateInput {
  return {
    name: "order_delivered",
    bodyParams: [input.orderNumber],
  };
}

/**
 * COD orders can't be confirmed by reply within a template message — this
 * sends Quick Reply buttons and the app.'s courier/order webhook must
 * separately handle the button-click payload
 * (`COD_CONFIRM_{orderNumber}` / `COD_CANCEL_{orderNumber}`) to act on it.
 * That inbound-webhook handling is intentionally out of scope here (this
 * project has no inbound WhatsApp webhook route yet) — see the TODO on
 * lib/notifications/dispatch.ts.
 */
export function codConfirmationTemplate(input: {
  customerName: string;
  orderNumber: string;
  totalFormatted: string;
}): WhatsAppTemplateInput {
  return {
    name: "cod_order_confirmation",
    bodyParams: [input.customerName, input.orderNumber, input.totalFormatted],
    quickReplyPayloads: [`COD_CONFIRM_${input.orderNumber}`, `COD_CANCEL_${input.orderNumber}`],
  };
}
