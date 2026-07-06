import Image from "next/image";
import { getReviewPhotoUrl } from "@/lib/product-images";

export interface ReviewItem {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  photoUrls: unknown;
  createdAt: Date;
  reviewerName: string | null;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div aria-hidden="true" className="flex gap-0.5 text-terracotta">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i < rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            d="m12 3 2.9 6.3 6.8.7-5.1 4.6 1.5 6.7L12 17.8 5.9 21.3l1.5-6.7L2.3 10l6.8-.7L12 3Z"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}

function reviewPhotos(photoUrls: unknown): string[] {
  if (!Array.isArray(photoUrls)) return [];
  return photoUrls.filter((v): v is string => typeof v === "string");
}

/** Real reviews (submitted via UploadThing) store an actual URL; seed data
 * predates uploads and uses opaque "review-photo:x:1" tokens fed through the
 * placeholder generator instead — tell them apart by shape. */
function resolvePhotoSrc(token: string): string {
  if (token.startsWith("http://") || token.startsWith("https://") || token.startsWith("/")) {
    return token;
  }
  return getReviewPhotoUrl(token);
}

export function ReviewsSection({
  reviews,
  average,
  count,
}: {
  reviews: ReviewItem[];
  average: number;
  count: number;
}) {
  return (
    <section aria-labelledby="reviews-heading" className="border-t border-ink/10 pt-12">
      <div className="flex items-center gap-3">
        <h2 id="reviews-heading" className="font-display text-2xl text-ink">
          Customer Reviews
        </h2>
        {count > 0 ? (
          <span className="flex items-center gap-1.5 text-sm text-ink/60">
            <Stars rating={Math.round(average)} />
            {average.toFixed(1)} ({count} review{count === 1 ? "" : "s"})
          </span>
        ) : null}
      </div>

      {count === 0 ? (
        <p className="mt-4 text-sm text-ink/60">
          No reviews yet — be the first to share your thoughts once you&apos;ve
          worn it in.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-8">
          {reviews.map((review) => {
            const photos = reviewPhotos(review.photoUrls);
            return (
              <li key={review.id} className="border-b border-ink/10 pb-8 last:border-0">
                <div className="flex items-center justify-between gap-3">
                  <Stars rating={review.rating} />
                  <time
                    dateTime={review.createdAt.toISOString()}
                    className="text-xs text-ink/60"
                  >
                    {review.createdAt.toLocaleDateString("en-PK", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </div>
                {review.title ? (
                  <h3 className="mt-2 text-sm font-semibold text-ink">
                    {review.title}
                  </h3>
                ) : null}
                {review.body ? (
                  <p className="mt-1 text-sm leading-relaxed text-ink/70">
                    {review.body}
                  </p>
                ) : null}
                {photos.length > 0 ? (
                  <div className="mt-3 flex gap-2">
                    {photos.map((token, i) => (
                      <div
                        key={token + i}
                        className="relative size-16 overflow-hidden rounded-lg bg-ink/5"
                      >
                        <Image
                          src={resolvePhotoSrc(token)}
                          alt={`Photo from ${review.reviewerName ?? "a customer"}'s review`}
                          fill
                          unoptimized
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
                <p className="mt-2 text-xs text-ink/60">
                  {review.reviewerName ?? "Verified buyer"}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
