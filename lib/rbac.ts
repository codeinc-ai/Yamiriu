/**
 * Role-Based Access Control (PRD S-002).
 *
 * This module is intentionally dependency-free and pure so it can run in the
 * Edge runtime (proxy.ts) and be unit-tested in isolation. It is the single
 * source of truth for "what may role X do", checked BOTH in proxy.ts and again
 * inside every Server Action / Route Handler (PRD Universal Rule 12).
 */

export const ROLES = [
  "customer",
  "owner",
  "admin",
  "product_manager",
  "order_fulfillment",
  "support",
] as const;

export type Role = (typeof ROLES)[number];

/** Everyone except a plain customer is "staff" and may reach the admin panel. */
export const STAFF_ROLES: readonly Role[] = [
  "owner",
  "admin",
  "product_manager",
  "order_fulfillment",
  "support",
];

/**
 * Granular permissions. Named `<domain>:<action>`.
 * `admin:access` is the coarse gate for reaching /admin at all.
 */
export const PERMISSIONS = [
  "admin:access",
  "products:read",
  "products:write",
  "outfit_assets:read",
  "outfit_assets:write",
  "discounts:read",
  "discounts:write",
  "gift_cards:read",
  "gift_cards:write",
  "orders:read",
  "orders:write", // status changes, tracking, courier handoff
  "orders:refund", // financial: refunds / cancellations with money movement
  "customers:read",
  "customers:write", // flag / ban abusive accounts
  "returns:manage", // approve / deny return requests
  "content:read",
  "content:write", // banners, lookbook, journal
  "analytics:read",
  "team:read",
  "team:manage", // invite staff, assign roles
  "audit:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL_PERMISSIONS: readonly Permission[] = PERMISSIONS;

/**
 * Permission matrix per PRD S-002:
 * - owner: full access, manages team/roles
 * - admin: full operational access, NO team management
 * - product_manager: products, outfit assets, discounts
 * - order_fulfillment: orders, courier handoff, NO product edits, NO refunds
 * - support: customer view, returns, NO product / order-financial edits
 * - customer: own account only (no admin-panel permissions)
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: ALL_PERMISSIONS,

  admin: ALL_PERMISSIONS.filter(
    (p) => p !== "team:read" && p !== "team:manage"
  ),

  product_manager: [
    "admin:access",
    "products:read",
    "products:write",
    "outfit_assets:read",
    "outfit_assets:write",
    "discounts:read",
    "discounts:write",
    "analytics:read",
  ],

  order_fulfillment: [
    "admin:access",
    "orders:read",
    "orders:write",
    "customers:read",
  ],

  support: [
    "admin:access",
    "customers:read",
    "orders:read",
    "returns:manage",
  ],

  customer: [],
};

const PERMISSION_SETS = ROLES.reduce(
  (acc, role) => {
    acc[role] = new Set(ROLE_PERMISSIONS[role]);
    return acc;
  },
  {} as Record<Role, ReadonlySet<Permission>>
);

/** Minimal shape RBAC needs — decoupled from NextAuth's Session type. */
export interface AuthUser {
  id: string;
  role: Role;
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isStaff(role: Role): boolean {
  return role !== "customer";
}

/** Does this role hold the given permission? */
export function can(
  user: Pick<AuthUser, "role"> | Role | null | undefined,
  permission: Permission
): boolean {
  if (!user) return false;
  const role = typeof user === "string" ? user : user.role;
  return PERMISSION_SETS[role]?.has(permission) ?? false;
}

/** Is this role one of the allowed roles? */
export function hasRole(
  user: Pick<AuthUser, "role"> | Role | null | undefined,
  allowed: readonly Role[]
): boolean {
  if (!user) return false;
  const role = typeof user === "string" ? user : user.role;
  return allowed.includes(role);
}

/** May this role reach the admin panel at all? */
export function canAccessAdmin(
  user: Pick<AuthUser, "role"> | Role | null | undefined
): boolean {
  return can(user, "admin:access");
}

/** Thrown when an authorization check fails; carries the intended HTTP status. */
export class AuthorizationError extends Error {
  constructor(
    message = "You do not have permission to perform this action.",
    readonly status: 401 | 403 = 403
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Assert the user holds one of `allowed` roles, else throw AuthorizationError.
 * Returns the narrowed user for ergonomic call sites.
 */
export function requireRole<T extends AuthUser>(
  user: T | null | undefined,
  allowed: readonly Role[]
): T {
  if (!user) throw new AuthorizationError("Authentication required.", 401);
  if (!hasRole(user, allowed)) throw new AuthorizationError();
  return user;
}

/**
 * Assert the user holds `permission`, else throw AuthorizationError.
 * Returns the narrowed user for ergonomic call sites.
 */
export function requirePermission<T extends AuthUser>(
  user: T | null | undefined,
  permission: Permission
): T {
  if (!user) throw new AuthorizationError("Authentication required.", 401);
  if (!can(user, permission)) throw new AuthorizationError();
  return user;
}
