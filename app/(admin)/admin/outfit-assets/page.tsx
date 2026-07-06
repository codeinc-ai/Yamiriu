import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-guards";
import { can } from "@/lib/rbac";
import { getOutfitAssetStatus } from "@/lib/queries/admin-products";
import { categoryLabel } from "@/lib/categories";
import { Badge } from "@/components/ui/badge";
import { ModelPreviewButton } from "@/components/admin/model-preview-modal";

export const metadata: Metadata = {
  title: "Outfit Assets",
  robots: { index: false, follow: false },
};

export default async function AdminOutfitAssetsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user, "outfit_assets:read")) redirect("/admin");

  const rows = await getOutfitAssetStatus();
  const missingCount = rows.filter((r) => !r.hasModel).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Outfit Assets</h1>
        <p className="mt-1 text-sm text-ink/60">
          {rows.length} products · {missingCount} missing a 3D model
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white/60">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Published</th>
              <th className="px-4 py-3 font-medium">Model status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
                <td className="px-4 py-3 text-ink/70">{categoryLabel(row.category)}</td>
                <td className="px-4 py-3">
                  <Badge variant={row.published ? "olive" : "neutral"}>
                    {row.published ? "Published" : "Draft"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={row.hasModel ? "olive" : "terracotta"}>
                    {row.hasModel ? "Has model" : "Missing"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {row.hasModel && row.modelUrl ? (
                      <ModelPreviewButton category={row.category} modelUrl={row.modelUrl} />
                    ) : null}
                    <Link
                      href={`/admin/products/${row.id}`}
                      className="text-sm font-medium text-terracotta hover:underline"
                    >
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
