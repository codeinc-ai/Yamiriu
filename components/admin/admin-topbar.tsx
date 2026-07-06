import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { Role } from "@/lib/rbac";

const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  product_manager: "Product Manager",
  order_fulfillment: "Order Fulfillment",
  support: "Support",
  customer: "Customer",
};

export function AdminTopbar({ email, role }: { email: string; role: Role }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
      <Link href="/admin" className="font-display text-lg font-bold uppercase tracking-[0.2em] text-ink">
        Yamiriu Admin
      </Link>
      <div className="flex items-center gap-3">
        <div className="text-right text-sm">
          <p className="text-ink">{email}</p>
        </div>
        <Badge variant="terracotta">{ROLE_LABELS[role]}</Badge>
        <SignOutButton />
      </div>
    </div>
  );
}
