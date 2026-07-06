import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-guards";
import { can } from "@/lib/rbac";
import { getAdminGiftCardList } from "@/lib/queries/admin-gift-cards";
import { GiftCardsManager } from "@/components/admin/gift-cards-manager";

export const metadata: Metadata = {
  title: "Gift Cards",
  robots: { index: false, follow: false },
};

export default async function AdminGiftCardsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user, "gift_cards:read")) redirect("/admin");

  const giftCards = await getAdminGiftCardList();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl text-ink">Gift Cards</h1>
      <GiftCardsManager giftCards={giftCards} canWrite={can(user, "gift_cards:write")} />
    </div>
  );
}
