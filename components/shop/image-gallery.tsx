"use client";

import { useState } from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

export function ImageGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setZoomOpen(true)}
        aria-label={`Zoom image: ${alt}`}
        className="group relative overflow-hidden rounded-xl bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2"
        style={{ aspectRatio: "4 / 5" }}
      >
        <Image
          src={images[active]}
          alt={alt}
          fill
          unoptimized
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
        />
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-ink/70 px-3 py-1 text-xs text-cream opacity-0 transition-opacity group-hover:opacity-100">
          Click to zoom
        </span>
      </button>

      {images.length > 1 ? (
        <div className="flex gap-3">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={active === i}
              className={cn(
                "relative size-20 shrink-0 overflow-hidden rounded-lg border-2 bg-ink/5",
                active === i ? "border-terracotta" : "border-transparent"
              )}
            >
              <Image
                src={src}
                alt=""
                aria-hidden="true"
                fill
                unoptimized
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      <Modal open={zoomOpen} onClose={() => setZoomOpen(false)} title={alt}>
        <div
          className="relative overflow-hidden rounded-lg bg-ink/5"
          style={{ aspectRatio: "4 / 5" }}
        >
          <Image
            src={images[active]}
            alt={alt}
            fill
            unoptimized
            sizes="(min-width: 640px) 32rem, 90vw"
            className="object-cover"
          />
        </div>
      </Modal>
    </div>
  );
}
