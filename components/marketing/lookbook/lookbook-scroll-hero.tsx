"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Full-bleed editorial hero with a GSAP ScrollTrigger parallax/scale sequence
 * (PRD 4.1) — the image scales down and drifts as the page scrolls past it.
 * Skipped entirely under prefers-reduced-motion (PRD 10.5): the image just
 * renders statically with no scroll-linked transform.
 */
export function LookbookScrollHero({ imageUrl, title }: { imageUrl: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!imageRef.current || !containerRef.current) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        imageRef.current,
        { scale: 1.15, yPercent: -6 },
        {
          scale: 1,
          yPercent: 6,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative h-[75vh] w-full overflow-hidden">
      <div ref={imageRef} className="absolute inset-0">
        <Image src={imageUrl} alt={title} fill unoptimized priority sizes="100vw" className="object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6">
        <h1 className="font-display text-4xl text-cream sm:text-5xl">{title}</h1>
      </div>
    </div>
  );
}
