import "server-only";

/**
 * Shared HTTP helper for all outbound notification-channel calls (WhatsApp,
 * SMS) per FR-006: 10s timeout per attempt, 3 attempts total, exponential
 * backoff between retries (500ms, 1000ms). Retries on network failure,
 * timeout, and 5xx/429 responses only — a 4xx (other than 429) means the
 * request itself is wrong and won't succeed on retry.
 */
const TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 500;

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  input: string,
  init: RequestInit
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      clearTimeout(timeout);

      if (!isRetryableStatus(response.status) || attempt === MAX_ATTEMPTS) {
        return response;
      }
      lastError = new Error(`Retryable HTTP status ${response.status}`);
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
    }

    if (attempt < MAX_ATTEMPTS) {
      await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed after retries.");
}
