"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createLookbookEntry, updateLookbookEntry, deleteLookbookEntry } from "@/actions/admin/content";
import { lookbookFormSchema, type LookbookFormInput } from "@/lib/validations";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormAlert } from "@/components/ui/form-alert";
import { Badge } from "@/components/ui/badge";
import { ImageUploadField } from "./image-upload-field";
import type { AdminLookbookRow } from "@/lib/queries/admin-content";

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function LookbookForm({
  initial,
  productOptions,
  onDone,
}: {
  initial?: AdminLookbookRow;
  productOptions: Array<{ id: string; name: string }>;
  onDone: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LookbookFormInput>({
    resolver: zodResolver(lookbookFormSchema),
    defaultValues: initial
      ? { ...initial, description: initial.description ?? "" }
      : { title: "", slug: "", description: "", imageUrl: "", relatedProductIds: [], published: false },
  });
  const imageUrl = watch("imageUrl");

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const action = initial ? updateLookbookEntry : createLookbookEntry;
    const result = await action(values);
    if (!result.ok) {
      setFormError(result.error ?? "Something went wrong.");
      return;
    }
    toast.success(initial ? "Lookbook entry updated." : "Lookbook entry created.");
    onDone();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}
      <Input
        label="Title"
        error={errors.title?.message}
        {...register("title", { onChange: (e) => { if (!slugTouched) setValue("slug", slugify(e.target.value)); } })}
      />
      <Input label="Slug" error={errors.slug?.message} {...register("slug", { onChange: () => setSlugTouched(true) })} />
      <Textarea label="Description (optional)" error={errors.description?.message} {...register("description")} />
      <ImageUploadField label="Editorial image" value={imageUrl} onChange={(url) => setValue("imageUrl", url)} error={errors.imageUrl?.message} />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">Related products</label>
        <Controller
          control={control}
          name="relatedProductIds"
          render={({ field }) => (
            <select
              multiple
              value={field.value ?? []}
              onChange={(e) => field.onChange(Array.from(e.target.selectedOptions, (o) => o.value))}
              className="h-32 rounded-md border border-ink/20 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/30"
            >
              {productOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        />
      </div>
      <Controller
        control={control}
        name="published"
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" className="size-4" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
            Published
          </label>
        )}
      />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {initial ? "Save changes" : "Create entry"}
        </Button>
      </div>
    </form>
  );
}

export function LookbookManager({
  entries,
  productOptions,
  canWrite,
}: {
  entries: AdminLookbookRow[];
  productOptions: Array<{ id: string; name: string }>;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [modalEntry, setModalEntry] = useState<AdminLookbookRow | "new" | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function close() {
    setModalEntry(null);
    router.refresh();
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    setDeleting(true);
    const result = await deleteLookbookEntry(pendingDeleteId);
    setDeleting(false);
    setPendingDeleteId(null);
    if (result.ok) {
      toast.success("Lookbook entry deleted.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Something went wrong.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canWrite ? (
        <div className="flex justify-end">
          <Button type="button" onClick={() => setModalEntry("new")}>
            New entry
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.length === 0 ? (
          <p className="col-span-full rounded-xl border border-ink/10 bg-white/60 p-6 text-center text-sm text-ink/60">
            No lookbook entries yet.
          </p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-ink/10 bg-white/60 p-4">
              <div className="relative h-32 w-full overflow-hidden rounded-md bg-cream">
                <Image
                  src={entry.imageUrl}
                  alt={entry.title}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 20vw, 45vw"
                  className="object-cover"
                />
              </div>
              <p className="mt-2 font-medium text-ink">{entry.title}</p>
              <div className="mt-1 flex items-center justify-between">
                <Badge variant={entry.published ? "olive" : "neutral"}>{entry.published ? "Published" : "Draft"}</Badge>
                {canWrite ? (
                  <div className="flex items-center gap-3 text-sm">
                    <button type="button" className="font-medium text-terracotta hover:underline" onClick={() => setModalEntry(entry)}>
                      Edit
                    </button>
                    <button type="button" className="text-ink/60 hover:text-red-600" onClick={() => setPendingDeleteId(entry.id)}>
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={modalEntry !== null} onClose={() => setModalEntry(null)} title={modalEntry === "new" ? "New lookbook entry" : "Edit lookbook entry"}>
        {modalEntry !== null ? (
          <LookbookForm initial={modalEntry === "new" ? undefined : modalEntry} productOptions={productOptions} onDone={close} />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete this lookbook entry?"
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
