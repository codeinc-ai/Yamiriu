import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-guards";
import { can } from "@/lib/rbac";
import { getAdminDiscountList } from "@/lib/queries/admin-discounts";
import { DiscountsManager } from "@/components/admin/discounts-manager";

export const metadata: Metadata = {
  title: "Discounts",
  robots: { index: false, follow: false },
};

export default async function AdminDiscountsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user, "discounts:read")) redirect("/admin");

  const discounts = await getAdminDiscountList();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl text-ink">Discounts</h1>
      <DiscountsManager discounts={discounts} canWrite={can(user, "discounts:write")} />
    </div>
  );
}
