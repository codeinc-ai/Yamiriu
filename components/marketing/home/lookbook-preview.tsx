import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/marketing/reveal";
import { getPublishedLookbookEntries } from "@/lib/queries/lookbook";
import { Section } from "./section";

export async function LookbookPreview() {
  const entries = await getPublishedLookbookEntries(4);
  if (entries.length === 0) return null;

  return (
    <Section>
      <div className="flex items-end justify-between gap-4">
        <Reveal>
          <h2 className="font-display text-3xl text-ink">From the Lookbook</h2>
        </Reveal>
        <Link
          href="/lookbook"
          className="shrink-0 text-sm text-terracotta hover:underline"
        >
          Explore &rarr;
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {entries.map((entry, i) => (
          <Reveal key={entry.id} delay={i * 0.05}>
            <Link
              href={`/lookbook/${entry.slug}`}
              className="group relative block overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-ink/5">
                <Image
                  src={entry.imageUrl}
                  alt={entry.title}
                  fill
                  unoptimized
                  sizes="(min-width: 768px) 24vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
              <span className="absolute bottom-4 left-4 font-display text-lg text-cream">
                {entry.title}
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
