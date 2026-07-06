export interface WhatsAppTemplateInput {
  name: string;
  languageCode?: string;
  bodyParams?: string[];
  /** For a template with a dynamic URL button — only the suffix appended to
   * the button's base URL (defined at template-creation time), per Meta's
   * URL-button parameter convention. */
  buttonUrlParam?: string;
  /** For a template with Quick Reply buttons, index-ordered opaque payload
   * strings echoed back in the button-click webhook. */
  quickReplyPayloads?: string[];
}

export interface WhatsAppSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/** Common interface every notification channel implements (PRD Rule 4). */
export interface WhatsAppService {
  sendTemplate(to: string, template: WhatsAppTemplateInput): Promise<WhatsAppSendResult>;
}
