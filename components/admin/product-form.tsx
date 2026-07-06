"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { productFormSchema, type ProductFormInput } from "@/lib/validations";
import { createProduct, updateProduct } from "@/actions/admin/products";
import { uploadFiles } from "@/lib/uploadthing";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { ModelPreviewButton } from "@/components/admin/model-preview-modal";
import type { AdminProductDetail } from "@/lib/queries/admin-products";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductForm({ initial }: { initial?: AdminProductDetail }) {
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [imageUploading, setImageUploading] = useState(false);
  const [modelUploading, setModelUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initial
      ? {
          id: initial.id,
          name: initial.name,
          slug: initial.slug,
          description: initial.description ?? "",
          price: Number(initial.price),
          category: initial.category,
          itemType: (initial.itemType as ProductFormInput["itemType"]) ?? undefined,
          images: initial.images,
          hasModel: initial.hasModel,
          modelUrl: initial.modelUrl ?? "",
          published: initial.published,
          variants: initial.variants,
        }
      : {
          name: "",
          slug: "",
          description: "",
          price: 0,
          category: "women",
          images: [],
          hasModel: false,
          modelUrl: "",
          published: false,
          variants: [],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });
  const images = watch("images") ?? [];
  const hasModel = watch("hasModel");
  const modelUrl = watch("modelUrl");
  const category = watch("category");

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 6 - images.length);
    if (files.length === 0) return;
    setImageUploading(true);
    try {
      const uploaded = await uploadFiles("productImage", { files });
      setValue("images", [...images, ...uploaded.map((f) => f.ufsUrl)]);
    } catch {
      toast.error("Couldn't upload images. Please try again.");
    } finally {
      setImageUploading(false);
      event.target.value = "";
    }
  }

  function removeImage(url: string) {
    setValue("images", images.filter((i) => i !== url));
  }

  async function handleModelUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setModelUploading(true);
    try {
      const [uploaded] = await uploadFiles("productModel", { files: [file] });
      setValue("modelUrl", uploaded.ufsUrl);
      setValue("hasModel", true);
    } catch {
      toast.error("Couldn't upload the model. Please check it's a valid .glb under 50MB.");
    } finally {
      setModelUploading(false);
      event.target.value = "";
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const action = initial ? updateProduct : createProduct;
    const result = await action(values);
    if (!result.ok) {
      setFormError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    toast.success(initial ? "Product updated." : "Product created.");
    router.push("/admin/products");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}

      <section className="flex flex-col gap-4 rounded-xl border border-ink/10 bg-white/60 p-6">
        <h2 className="font-display text-lg text-ink">Details</h2>
        <Input
          label="Name"
          error={errors.name?.message}
          {...register("name", {
            onChange: (e) => {
              if (!slugTouched) setValue("slug", slugify(e.target.value));
            },
          })}
        />
        <Input
          label="Slug"
          error={errors.slug?.message}
          {...register("slug", { onChange: () => setSlugTouched(true) })}
        />
        <Textarea
          label="Description"
          hint="Basic formatting (bold, italics, lists, links) is sanitized and preserved."
          error={errors.description?.message}
          {...register("description")}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Price (PKR)"
            type="number"
            step="0.01"
            error={errors.price?.message}
            {...register("price", { valueAsNumber: true })}
          />
          <Select label="Category" error={errors.category?.message} {...register("category")}>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="kids">Kids</option>
          </Select>
          <Select label="Item type" error={errors.itemType?.message} {...register("itemType")}>
            <option value="">—</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="shoes">Shoes</option>
            <option value="accessory">Accessory</option>
            <option value="jacket">Jacket</option>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" className="size-4" {...register("published")} />
          Published
        </label>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-ink/10 bg-white/60 p-6">
        <h2 className="font-display text-lg text-ink">Images</h2>
        <div className="flex flex-wrap gap-3">
          {images.map((url) => (
            <div key={url} className="relative size-24 overflow-hidden rounded-lg border border-ink/10 bg-cream">
              <Image src={url} alt="Uploaded product image" fill unoptimized sizes="96px" className="object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                aria-label="Remove image"
                className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-ink/70 text-xs text-cream"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {images.length < 6 ? (
          <div>
            <label htmlFor="product-images" className="text-sm font-medium text-ink">
              Upload images (up to 6)
            </label>
            <input
              id="product-images"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={handleImageUpload}
              disabled={imageUploading}
              className="mt-1.5 block w-full text-sm text-ink/70 file:mr-3 file:rounded-md file:border-0 file:bg-ink/5 file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
            />
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-ink/10 bg-white/60 p-6">
        <h2 className="font-display text-lg text-ink">3D model</h2>
        <p className="text-sm text-ink/60">
          Upload a .glb (max 50MB) and preview it on the avatar before publishing (PRD 4.8.4).
        </p>
        <label htmlFor="product-model" className="text-sm font-medium text-ink">
          Upload .glb
        </label>
        <input
          id="product-model"
          type="file"
          accept=".glb,model/gltf-binary"
          onChange={handleModelUpload}
          disabled={modelUploading}
          className="block w-full text-sm text-ink/70 file:mr-3 file:rounded-md file:border-0 file:bg-ink/5 file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
        />
        {hasModel && modelUrl ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-olive">Model uploaded.</p>
            <ModelPreviewButton category={category} modelUrl={modelUrl} />
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-ink/10 bg-white/60 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Variants</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => append({ size: "", color: "", stock: 0, sku: "" })}
          >
            Add variant
          </Button>
        </div>
        {fields.length === 0 ? (
          <p className="text-sm text-ink/60">No variants yet — add a size/color combination.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-end gap-3">
                <Input label="Size" error={errors.variants?.[index]?.size?.message} {...register(`variants.${index}.size`)} />
                <Input label="Color" error={errors.variants?.[index]?.color?.message} {...register(`variants.${index}.color`)} />
                <Input
                  label="Stock"
                  type="number"
                  error={errors.variants?.[index]?.stock?.message}
                  {...register(`variants.${index}.stock`, { valueAsNumber: true })}
                />
                <Input label="SKU" error={errors.variants?.[index]?.sku?.message} {...register(`variants.${index}.sku`)} />
                <Button type="button" variant="secondary" size="sm" onClick={() => remove(index)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {initial ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
