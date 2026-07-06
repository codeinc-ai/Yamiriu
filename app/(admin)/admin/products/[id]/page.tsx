import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-guards";
import { can } from "@/lib/rbac";
import { getAdminProductDetail } from "@/lib/queries/admin-products";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = {
  title: "Edit Product",
  robots: { index: false, follow: false },
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !can(user, "products:read")) redirect("/admin");
  if (!can(user, "products:write")) redirect(`/admin/products`);

  const { id } = await params;
  const product = await getAdminProductDetail(id);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl text-ink">Edit product</h1>
      <ProductForm initial={product} />
    </div>
  );
}
