export interface SmsSendResult {
  ok: boolean;
  error?: string;
}

/** Common interface every SMS provider implements (PRD Rule 4). */
export interface SmsService {
  sendSms(to: string, message: string): Promise<SmsSendResult>;
}
