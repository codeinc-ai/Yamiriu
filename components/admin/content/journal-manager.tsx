"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createJournalPost, updateJournalPost, deleteJournalPost } from "@/actions/admin/content";
import { journalFormSchema, type JournalFormInput } from "@/lib/validations";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormAlert } from "@/components/ui/form-alert";
import { Badge } from "@/components/ui/badge";
import { ImageUploadField } from "./image-upload-field";
import type { AdminJournalRow } from "@/lib/queries/admin-content";

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function JournalForm({ initial, onDone }: { initial?: AdminJournalRow; onDone: () => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<JournalFormInput>({
    resolver: zodResolver(journalFormSchema),
    defaultValues: initial
      ? { ...initial, excerpt: initial.excerpt ?? "", coverImageUrl: initial.coverImageUrl ?? "", category: initial.category ?? "" }
      : { title: "", slug: "", excerpt: "", content: "", coverImageUrl: "", category: "", published: false },
  });
  const coverImageUrl = watch("coverImageUrl");

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const action = initial ? updateJournalPost : createJournalPost;
    const result = await action(values);
    if (!result.ok) {
      setFormError(result.error ?? "Something went wrong.");
      return;
    }
    toast.success(initial ? "Journal post updated." : "Journal post created.");
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
      <Input label="Category (optional)" error={errors.category?.message} {...register("category")} />
      <Textarea label="Excerpt (optional)" error={errors.excerpt?.message} {...register("excerpt")} rows={2} />
      <ImageUploadField label="Cover image (optional)" value={coverImageUrl ?? ""} onChange={(url) => setValue("coverImageUrl", url)} error={errors.coverImageUrl?.message} />
      <Textarea
        label="Content"
        hint="Basic formatting (bold, italics, headings, lists, links, quotes) is sanitized and preserved."
        error={errors.content?.message}
        rows={10}
        {...register("content")}
      />
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
          {initial ? "Save changes" : "Create post"}
        </Button>
      </div>
    </form>
  );
}

export function JournalManager({ posts, canWrite }: { posts: AdminJournalRow[]; canWrite: boolean }) {
  const router = useRouter();
  const [modalPost, setModalPost] = useState<AdminJournalRow | "new" | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function close() {
    setModalPost(null);
    router.refresh();
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    setDeleting(true);
    const result = await deleteJournalPost(pendingDeleteId);
    setDeleting(false);
    setPendingDeleteId(null);
    if (result.ok) {
      toast.success("Journal post deleted.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Something went wrong.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canWrite ? (
        <div className="flex justify-end">
          <Button type="button" onClick={() => setModalPost("new")}>
            New post
          </Button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white/60">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canWrite ? <th className="px-4 py-3 font-medium">Actions</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink/60">
                  No journal posts yet.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id}>
                  <td className="px-4 py-3 font-medium text-ink">{post.title}</td>
                  <td className="px-4 py-3 text-ink/70">{post.category ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={post.published ? "olive" : "neutral"}>{post.published ? "Published" : "Draft"}</Badge>
                  </td>
                  {canWrite ? (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button type="button" className="font-medium text-terracotta hover:underline" onClick={() => setModalPost(post)}>
                          Edit
                        </button>
                        <button type="button" className="text-ink/60 hover:text-red-600" onClick={() => setPendingDeleteId(post.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalPost !== null}
        onClose={() => setModalPost(null)}
        title={modalPost === "new" ? "New journal post" : "Edit journal post"}
        className="max-w-2xl"
      >
        {modalPost !== null ? <JournalForm initial={modalPost === "new" ? undefined : modalPost} onDone={close} /> : null}
      </Modal>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete this journal post?"
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
