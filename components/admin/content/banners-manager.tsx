"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createBanner, updateBanner, deleteBanner } from "@/actions/admin/content";
import { bannerFormSchema, type BannerFormInput } from "@/lib/validations";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormAlert } from "@/components/ui/form-alert";
import { Badge } from "@/components/ui/badge";
import { ImageUploadField } from "./image-upload-field";
import type { AdminBannerRow } from "@/lib/queries/admin-content";

function BannerForm({ initial, onDone }: { initial?: AdminBannerRow; onDone: () => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BannerFormInput>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: initial
      ? { ...initial, linkUrl: initial.linkUrl ?? "", title: initial.title ?? "" }
      : { imageUrl: "", linkUrl: "", title: "", active: false, sortOrder: 0 },
  });
  const imageUrl = watch("imageUrl");

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const action = initial ? updateBanner : createBanner;
    const result = await action(values);
    if (!result.ok) {
      setFormError(result.error ?? "Something went wrong.");
      return;
    }
    toast.success(initial ? "Banner updated." : "Banner created.");
    onDone();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}
      <ImageUploadField label="Image" value={imageUrl} onChange={(url) => setValue("imageUrl", url)} error={errors.imageUrl?.message} />
      <Input label="Title (optional)" error={errors.title?.message} {...register("title")} />
      <Input label="Link URL (optional)" error={errors.linkUrl?.message} {...register("linkUrl")} />
      <Input label="Sort order" type="number" error={errors.sortOrder?.message} {...register("sortOrder", { valueAsNumber: true })} />
      <Controller
        control={control}
        name="active"
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" className="size-4" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
            Active
          </label>
        )}
      />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {initial ? "Save changes" : "Create banner"}
        </Button>
      </div>
    </form>
  );
}

export function BannersManager({ banners: initialBanners, canWrite }: { banners: AdminBannerRow[]; canWrite: boolean }) {
  const router = useRouter();
  const [modalBanner, setModalBanner] = useState<AdminBannerRow | "new" | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function close() {
    setModalBanner(null);
    router.refresh();
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    setDeleting(true);
    const result = await deleteBanner(pendingDeleteId);
    setDeleting(false);
    setPendingDeleteId(null);
    if (result.ok) {
      toast.success("Banner deleted.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Something went wrong.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canWrite ? (
        <div className="flex justify-end">
          <Button type="button" onClick={() => setModalBanner("new")}>
            New banner
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {initialBanners.length === 0 ? (
          <p className="rounded-xl border border-ink/10 bg-white/60 p-6 text-center text-sm text-ink/60">
            No banners yet.
          </p>
        ) : (
          initialBanners.map((banner) => (
            <div key={banner.id} className="flex items-center gap-4 rounded-xl border border-ink/10 bg-white/60 p-4">
              <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-md bg-cream">
                <Image
                  src={banner.imageUrl}
                  alt={banner.title || "Banner preview"}
                  fill
                  unoptimized
                  sizes="112px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-ink">{banner.title || "Untitled banner"}</p>
                <p className="text-xs text-ink/60">{banner.linkUrl || "No link"}</p>
              </div>
              <Badge variant={banner.active ? "olive" : "neutral"}>{banner.active ? "Active" : "Inactive"}</Badge>
              {canWrite ? (
                <div className="flex items-center gap-3 text-sm">
                  <button type="button" className="font-medium text-terracotta hover:underline" onClick={() => setModalBanner(banner)}>
                    Edit
                  </button>
                  <button type="button" className="text-ink/60 hover:text-red-600" onClick={() => setPendingDeleteId(banner.id)}>
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <Modal open={modalBanner !== null} onClose={() => setModalBanner(null)} title={modalBanner === "new" ? "New banner" : "Edit banner"}>
        {modalBanner !== null ? <BannerForm initial={modalBanner === "new" ? undefined : modalBanner} onDone={close} /> : null}
      </Modal>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete this banner?"
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
