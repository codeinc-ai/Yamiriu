import { NextResponse } from "next/server";
import { processPaymentWebhook, parseWebhookBody } from "@/lib/payments/webhook-handler";

export async function POST(request: Request) {
  const payload = await parseWebhookBody(request);
  const result = await processPaymentWebhook("easypaisa", "easypaisa", payload, null);
  return NextResponse.json(result.body, { status: result.httpStatus });
}
