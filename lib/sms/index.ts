import { localGatewaySmsService } from "./local-gateway";
import type { SmsService } from "./types";

export type { SmsService, SmsSendResult } from "./types";

export function getSmsService(): SmsService {
  return localGatewaySmsService;
}
