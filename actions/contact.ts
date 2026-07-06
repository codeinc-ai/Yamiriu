"use server";

import { headers } from "next/headers";
import { contactFormSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { sendContactMessageEmail } from "@/lib/email";

export interface ContactActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

export async function submitContactForm(input: unknown): Promise<ContactActionResult> {
  const ip = getClientIp(await headers());
  const rl = await checkRateLimit("api", ip);
  if (!rl.success) {
    return { ok: false, error: "Too many attempts. Please try again shortly." };
  }

  const parsed = contactFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check your details and try again.",
    };
  }

  // Honeypot tripped — pretend success so bots don't learn to avoid the field.
  if (parsed.data.company) {
    return { ok: true, message: "Thanks — we'll be in touch soon." };
  }

  try {
    await sendContactMessageEmail({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
    });
  } catch {
    return {
      ok: false,
      error: "Something went wrong sending your message. Please try WhatsApp instead.",
    };
  }

  return { ok: true, message: "Thanks — we'll be in touch soon." };
}
