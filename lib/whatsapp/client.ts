import "server-only";
import { env } from "@/lib/env";
import { fetchWithRetry } from "@/lib/notifications/fetch-with-retry";
import { reportError } from "@/lib/report-error";
import type { WhatsAppService, WhatsAppTemplateInput, WhatsAppSendResult } from "./types";

/**
 * WhatsApp Business Cloud API (graph.facebook.com) — the official Meta API,
 * not a third-party wrapper. Pinned to a specific Graph API version since
 * Meta deprecates versions on a ~2-year cycle.
 *
 * IMPORTANT: templates referenced by name (order_confirmation, order_shipped,
 * order_delivered, cod_order_confirmation — see ./templates.ts) must be
 * created and approved in Meta Business Manager before they can be sent;
 * this client only invokes them by name/params, it doesn't create them.
 * Component `type` values are sent lowercase ("body"/"button") per the
 * send-message API reference — Meta's template-creation API docs use
 * uppercase for the same concept, which is a documented source of confusion.
 */
const GRAPH_API_VERSION = "v23.0";

interface WhatsAppComponent {
  type: "header" | "body" | "button";
  sub_type?: "url" | "quick_reply";
  index?: string;
  parameters: Array<{ type: "text" | "payload"; text?: string; payload?: string }>;
}

function buildComponents(template: WhatsAppTemplateInput): WhatsAppComponent[] {
  const components: WhatsAppComponent[] = [];

  if (template.bodyParams?.length) {
    components.push({
      type: "body",
      parameters: template.bodyParams.map((text) => ({ type: "text", text })),
    });
  }

  if (template.buttonUrlParam) {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: template.buttonUrlParam }],
    });
  }

  if (template.quickReplyPayloads?.length) {
    template.quickReplyPayloads.forEach((payload, i) => {
      components.push({
        type: "button",
        sub_type: "quick_reply",
        index: String(i),
        parameters: [{ type: "payload", payload }],
      });
    });
  }

  return components;
}

export const whatsAppService: WhatsAppService = {
  async sendTemplate(to: string, template: WhatsAppTemplateInput): Promise<WhatsAppSendResult> {
    if (!env.WHATSAPP_BUSINESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
      console.info(`[whatsapp] (not configured, not sent) template=${template.name}`);
      return { ok: false, error: "WhatsApp is not configured." };
    }

    try {
      const response = await fetchWithRetry(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.WHATSAPP_BUSINESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "template",
            template: {
              name: template.name,
              language: { code: template.languageCode ?? "en" },
              components: buildComponents(template),
            },
          }),
        }
      );

      const data = (await response.json()) as {
        messages?: Array<{ id: string }>;
        error?: { message: string; code: number };
      };

      if (!response.ok || data.error) {
        // Never log the recipient number or message content (S-023) — the
        // template name + provider error code are enough to debug from.
        reportError(new Error(data.error?.message ?? "WhatsApp send failed"), {
          template: template.name,
          errorCode: data.error?.code,
        });
        return { ok: false, error: data.error?.message ?? "Failed to send WhatsApp message." };
      }

      return { ok: true, messageId: data.messages?.[0]?.id };
    } catch (error) {
      reportError(error, { template: template.name, stage: "whatsapp_send" });
      return { ok: false, error: "Failed to send WhatsApp message." };
    }
  },
};
