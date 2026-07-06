import type { Permission } from "@/lib/rbac";

export interface AdminNavItem {
  href: string;
  label: string;
  permission: Permission;
}

/** Full admin section list (PRD 4.8) — components/admin/admin-sidebar-nav.tsx
 * filters this down to what the current user's role permits (Rule 12: the
 * page/action behind each link re-checks the same permission itself, this
 * filtering is a UX convenience only, never the actual gate). */
export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", permission: "admin:access" },
  { href: "/admin/products", label: "Products", permission: "products:read" },
  { href: "/admin/outfit-assets", label: "Outfit Assets", permission: "outfit_assets:read" },
  { href: "/admin/orders", label: "Orders", permission: "orders:read" },
  { href: "/admin/customers", label: "Customers", permission: "customers:read" },
  { href: "/admin/discounts", label: "Discounts", permission: "discounts:read" },
  { href: "/admin/gift-cards", label: "Gift Cards", permission: "gift_cards:read" },
  { href: "/admin/content", label: "Content", permission: "content:read" },
  { href: "/admin/analytics", label: "Analytics", permission: "analytics:read" },
  { href: "/admin/team", label: "Team", permission: "team:read" },
] as const;
