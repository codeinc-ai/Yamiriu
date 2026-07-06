import "server-only";

/** Keyset (never OFFSET) pagination cursor — PRD Rule 4 / FR-004. */
export interface CursorPayload {
  v: string;
  id: string;
}

export function encodeCursor(value: string, id: string): string {
  return Buffer.from(JSON.stringify({ v: value, id } satisfies CursorPayload)).toString(
    "base64url"
  );
}

export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (typeof parsed?.v === "string" && typeof parsed?.id === "string") {
      return parsed;
    }
  } catch {
    // fall through
  }
  return null;
}
