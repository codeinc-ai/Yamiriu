import "server-only";
import { env } from "@/lib/env";
import { fetchWithRetry } from "@/lib/notifications/fetch-with-retry";
import { reportError } from "@/lib/report-error";
import type { SmsService, SmsSendResult } from "./types";

/**
 * STUB adapter for a local Pakistani SMS gateway (PRD 2.5, Batch 4) — used
 * as the fallback channel when WhatsApp is unavailable/unconfigured. No
 * specific provider has been chosen yet (candidates: Telenor/Jazz/Zong
 * aggregator APIs, or a reseller like Instant Messaging / Sinch's Pakistan
 * route) — the endpoint URL and request shape below are placeholders
 * matching the common "api_key + sender_id + to + message" pattern most of
 * these aggregators share, NOT a verified integration. Swap the request
 * body/endpoint for the real provider's docs once one is selected; the
 * SmsService interface and call sites (lib/notifications/dispatch.ts) won't
 * need to change.
 */
const PLACEHOLDER_ENDPOINT = "https://api.sms-gateway.example.pk/v1/send"; // TODO: replace with real provider

export const localGatewaySmsService: SmsService = {
  async sendSms(to: string, message: string): Promise<SmsSendResult> {
    if (!env.SMS_GATEWAY_API_KEY) {
      console.info("[sms] (not configured, not sent) local gateway stub");
      return { ok: false, error: "SMS gateway is not configured." };
    }

    try {
      const response = await fetchWithRetry(PLACEHOLDER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: env.SMS_GATEWAY_API_KEY,
          sender_id: env.SMS_GATEWAY_SENDER_ID ?? "Yamiriu",
          to,
          message,
        }),
      });

      if (!response.ok) {
        reportError(new Error(`SMS gateway responded with status ${response.status}`), {
          stage: "sms_send",
        });
        return { ok: false, error: "Failed to send SMS." };
      }

      return { ok: true };
    } catch (error) {
      reportError(error, { stage: "sms_send" });
      return { ok: false, error: "Failed to send SMS." };
    }
  },
};
