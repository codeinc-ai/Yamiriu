"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { submitReview } from "@/actions/reviews";
import { uploadFiles } from "@/lib/uploadthing";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { cn } from "@/lib/utils";

const reviewFormSchema = z.object({
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().max(3000).optional().or(z.literal("")),
});
type ReviewFormValues = z.infer<typeof reviewFormSchema>;

/** Only rendered when the PDP has already confirmed (server-side) the
 * current user has a delivered order for this product and hasn't reviewed
 * it yet — see getReviewEligibility in actions/reviews.ts. */
export function ReviewSubmissionForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(0);
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues>({ resolver: zodResolver(reviewFormSchema) });

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    setPhotos(Array.from(event.target.files ?? []).slice(0, 3));
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    if (rating === 0) {
      setFormError("Please select a rating.");
      return;
    }

    let photoUrls: string[] = [];
    if (photos.length > 0) {
      setUploading(true);
      try {
        const uploaded = await uploadFiles("reviewPhoto", { files: photos });
        photoUrls = uploaded.map((file) => file.ufsUrl);
      } catch {
        setFormError("Couldn't upload your photos. Please try again.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const result = await submitReview({
      productId,
      rating,
      title: values.title,
      body: values.body,
      photoUrls,
    });

    if (!result.ok) {
      setFormError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    setSubmitted(true);
    toast.success("Thanks! Your review is awaiting moderation.");
  });

  if (submitted) {
    return (
      <FormAlert variant="success">
        Thanks for your review — it&apos;ll appear here once approved.
      </FormAlert>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-xl border border-ink/10 bg-white/60 p-6"
    >
      <h3 className="font-display text-lg text-ink">Write a review</h3>
      {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}

      <div>
        <p className="mb-1.5 text-sm font-medium text-ink">Rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              aria-pressed={rating >= value}
              onClick={() => setRating(value)}
              className="p-1 text-terracotta"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill={rating >= value ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path
                  d="m12 3 2.9 6.3 6.8.7-5.1 4.6 1.5 6.7L12 17.8 5.9 21.3l1.5-6.7L2.3 10l6.8-.7L12 3Z"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <Input label="Title (optional)" error={errors.title?.message} {...register("title")} />
      <Textarea label="Your review (optional)" error={errors.body?.message} {...register("body")} />

      <div>
        <label htmlFor="review-photos" className="text-sm font-medium text-ink">
          Photos (optional, up to 3)
        </label>
        <input
          id="review-photos"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={handlePhotoChange}
          className={cn(
            "mt-1.5 block w-full text-sm text-ink/70",
            "file:mr-3 file:rounded-md file:border-0 file:bg-ink/5 file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
          )}
        />
      </div>

      <Button type="submit" loading={isSubmitting || uploading} className="self-start">
        Submit review
      </Button>
    </form>
  );
}
