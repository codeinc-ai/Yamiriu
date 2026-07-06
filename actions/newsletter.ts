"use server";

import { headers } from "next/headers";
import { emailSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

export interface NewsletterResult {
  ok: boolean;
  message: string;
}

/**
 * Newsletter opt-in (placeholder). Validates + rate-limits; real ESP wiring
 * (Resend audiences / provider) is deferred. Always returns a friendly message.
 */
export async function subscribeToNewsletter(
  input: unknown
): Promise<NewsletterResult> {
  const ip = getClientIp(await headers());
  const rl = await checkRateLimit("api", ip);
  if (!rl.success) {
    return { ok: false, message: "Too many requests. Please try again shortly." };
  }

  const parsed = emailSchema.safeParse(
    typeof input === "object" && input !== null && "email" in input
      ? (input as { email: unknown }).email
      : input
  );
  if (!parsed.success) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  // TODO: persist / forward to email provider audience.
  return { ok: true, message: "You're on the list — welcome to Yamiriu." };
}
