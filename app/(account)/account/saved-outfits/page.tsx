import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth-guards";
import { getSavedOutfitsForUser } from "@/lib/queries/saved-outfits";
import { SavedOutfitsGrid } from "@/components/account/saved-outfits-grid";

export const metadata: Metadata = {
  title: "Saved Outfits",
  robots: { index: false, follow: false },
};

export default async function SavedOutfitsPage() {
  // AccountLayout already guarantees an authenticated user for this route.
  const user = await getCurrentUser();
  const outfits = user ? await getSavedOutfitsForUser(user.id) : [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl text-ink">Saved Outfits</h1>
      <SavedOutfitsGrid initialOutfits={outfits} />
    </div>
  );
}
