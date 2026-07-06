"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { bulkSetProductsPublished, softDeleteProduct } from "@/actions/admin/products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatPkr } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";
import type { AdminProductListItem } from "@/lib/queries/admin-products";

export function ProductsTable({ items }: { items: AdminProductListItem[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === items.length ? new Set() : new Set(items.map((i) => i.id))));
  }

  function bulkSetPublished(published: boolean) {
    startTransition(async () => {
      const result = await bulkSetProductsPublished({ productIds: Array.from(selected), published });
      if (result.ok) {
        toast.success(published ? "Products published." : "Products unpublished.");
        setSelected(new Set());
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  }

  function confirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    startTransition(async () => {
      const result = await softDeleteProduct(id);
      setPendingDeleteId(null);
      if (result.ok) {
        toast.success("Product deleted.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-terracotta/25 bg-terracotta/[0.04] px-4 py-2.5 text-sm">
          <span className="font-medium text-ink">{selected.size} selected</span>
          <Button type="button" size="sm" variant="secondary" loading={isPending} onClick={() => bulkSetPublished(true)}>
            Publish
          </Button>
          <Button type="button" size="sm" variant="secondary" loading={isPending} onClick={() => bulkSetPublished(false)}>
            Unpublish
          </Button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white/60">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={items.length > 0 && selected.size === items.length}
                  onChange={toggleAll}
                  className="size-4"
                />
              </th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink/60">
                  No products found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${item.name}`}
                      checked={selected.has(item.id)}
                      onChange={() => toggle(item.id)}
                      className="size-4"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{item.name}</td>
                  <td className="px-4 py-3 text-ink/70">{categoryLabel(item.category)}</td>
                  <td className="px-4 py-3 text-ink/70">{formatPkr(item.price)}</td>
                  <td className="px-4 py-3 text-ink/70">
                    {item.totalStock <= 5 ? (
                      <Badge variant="terracotta">{item.totalStock} left</Badge>
                    ) : (
                      item.totalStock
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.published ? "olive" : "neutral"}>
                      {item.published ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/products/${item.id}`} className="font-medium text-terracotta hover:underline">
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(item.id)}
                        className="text-ink/60 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete this product?"
        description="This soft-deletes the product — it will stop showing up anywhere but the record is kept."
        confirmLabel="Delete"
        loading={isPending}
      />
    </div>
  );
}
