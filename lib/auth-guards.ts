import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  AuthorizationError,
  hasRole,
  can,
  isRole,
  requireRole,
  requirePermission,
  type AuthUser,
  type Permission,
  type Role,
} from "@/lib/rbac";

/**
 * Server-side auth guards. Every privileged Server Action and API Route must go
 * through one of these so the role is re-checked in the handler itself, not only
 * in proxy.ts (PRD Universal Rule 12, S-002, S-015).
 */

/** Resolve the current authenticated user (or null) from the JWT session. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !isRole(user.role)) return null;
  return { id: user.id, role: user.role };
}

/** Require any authenticated user; throws AuthorizationError(401) otherwise. */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("Authentication required.", 401);
  return user;
}

// ---------------------------------------------------------------------------
// Server Action wrappers (throw AuthorizationError on failure)
// ---------------------------------------------------------------------------

/** Wrap a Server Action so it only runs for authenticated users. */
export function withAuth<Args extends unknown[], Result>(
  handler: (user: AuthUser, ...args: Args) => Promise<Result>
): (...args: Args) => Promise<Result> {
  return async (...args: Args) => handler(await requireUser(), ...args);
}

/** Wrap a Server Action so it only runs for the given roles. */
export function withRole<Args extends unknown[], Result>(
  allowed: readonly Role[],
  handler: (user: AuthUser, ...args: Args) => Promise<Result>
): (...args: Args) => Promise<Result> {
  return async (...args: Args) => {
    const user = requireRole(await getCurrentUser(), allowed);
    return handler(user, ...args);
  };
}

/** Wrap a Server Action so it only runs for holders of `permission`. */
export function withPermission<Args extends unknown[], Result>(
  permission: Permission,
  handler: (user: AuthUser, ...args: Args) => Promise<Result>
): (...args: Args) => Promise<Result> {
  return async (...args: Args) => {
    const user = requirePermission(await getCurrentUser(), permission);
    return handler(user, ...args);
  };
}

// ---------------------------------------------------------------------------
// API Route handler wrappers (return 401/403 responses on failure)
// ---------------------------------------------------------------------------

type ApiHandler = (
  req: NextRequest,
  ctx: { user: AuthUser }
) => Promise<Response> | Response;

const UNAUTHORIZED = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const FORBIDDEN = () =>
  NextResponse.json({ error: "Forbidden" }, { status: 403 });

export function withApiAuth(handler: ApiHandler) {
  return async (req: NextRequest): Promise<Response> => {
    const user = await getCurrentUser();
    if (!user) return UNAUTHORIZED();
    return handler(req, { user });
  };
}

export function withApiRole(allowed: readonly Role[], handler: ApiHandler) {
  return async (req: NextRequest): Promise<Response> => {
    const user = await getCurrentUser();
    if (!user) return UNAUTHORIZED();
    if (!hasRole(user, allowed)) return FORBIDDEN();
    return handler(req, { user });
  };
}

export function withApiPermission(permission: Permission, handler: ApiHandler) {
  return async (req: NextRequest): Promise<Response> => {
    const user = await getCurrentUser();
    if (!user) return UNAUTHORIZED();
    if (!can(user, permission)) return FORBIDDEN();
    return handler(req, { user });
  };
}
