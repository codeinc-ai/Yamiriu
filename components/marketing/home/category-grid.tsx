import Link from "next/link";
import { Placeholder } from "@/components/ui/placeholder";
import { Reveal } from "@/components/marketing/reveal";
import { Section } from "./section";

const CATEGORIES = [
  { label: "Men", href: "/for-men", palette: "ink" as const },
  { label: "Women", href: "/for-women", palette: "terracotta" as const },
  { label: "Kids", href: "/for-kids", palette: "gold" as const },
];

export function CategoryGrid() {
  return (
    <Section>
      <Reveal>
        <h2 className="font-display text-3xl text-ink">Shop by category</h2>
      </Reveal>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {CATEGORIES.map((category, i) => (
          <Reveal key={category.href} delay={i * 0.05}>
            <Link
              href={category.href}
              className="group relative block overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              <Placeholder
                ratio="3/4"
                palette={category.palette}
                alt={`${category.label} collection`}
                rounded={false}
                sizes="(min-width: 640px) 33vw, 100vw"
                className="transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5">
                <span className="font-display text-2xl text-cream">
                  {category.label}
                </span>
                <span className="mt-1 block text-sm text-cream/80">
                  Shop {category.label} &rarr;
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
