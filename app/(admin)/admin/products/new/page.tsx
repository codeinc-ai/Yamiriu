import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-guards";
import { can } from "@/lib/rbac";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = {
  title: "New Product",
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
  const user = await getCurrentUser();
  if (!user || !can(user, "products:write")) redirect("/admin/products");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl text-ink">New product</h1>
      <ProductForm />
    </div>
  );
}
