/**
 * Pure route-authorization policy used by proxy.ts (Edge). Kept free of any
 * Next.js imports so it can be unit-tested deterministically. proxy.ts maps the
 * returned decision onto NextResponse.
 */
import { canAccessAdmin, type AuthUser } from "./rbac";

export type AccessDecision =
  | { type: "allow" }
  | { type: "redirect"; to: "/sign-in"; callbackUrl: string }
  | { type: "forbid" };

function isUnder(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/**
 * Only allow same-origin relative callback URLs to prevent open-redirects.
 * Anything external or malformed falls back to /account.
 */
export function sanitizeCallbackUrl(
  raw: string | null | undefined,
  fallback = "/account"
): string {
  if (!raw) return fallback;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return fallback;
}

/** Any authenticated user may access these. */
export function isProtectedCustomerPath(pathname: string): boolean {
  return isUnder(pathname, "/account");
}

/** Only staff roles may access these. */
export function isAdminPath(pathname: string): boolean {
  return isUnder(pathname, "/admin");
}

/**
 * Decide access for a request path given the (optimistically decoded) user.
 * - Unauthenticated on a protected path -> redirect to /sign-in?callbackUrl=...
 * - Authenticated non-staff on an admin path -> forbid (403)
 * - Otherwise -> allow
 */
export function evaluateAccess(input: {
  pathname: string;
  user: AuthUser | null;
}): AccessDecision {
  const { pathname, user } = input;

  if (isAdminPath(pathname)) {
    if (!user) {
      return { type: "redirect", to: "/sign-in", callbackUrl: pathname };
    }
    if (!canAccessAdmin(user)) {
      return { type: "forbid" };
    }
    return { type: "allow" };
  }

  if (isProtectedCustomerPath(pathname)) {
    if (!user) {
      return { type: "redirect", to: "/sign-in", callbackUrl: pathname };
    }
    return { type: "allow" };
  }

  return { type: "allow" };
}
