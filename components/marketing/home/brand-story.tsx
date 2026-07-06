import { ButtonLink } from "@/components/ui/button-link";
import { Placeholder } from "@/components/ui/placeholder";
import { Reveal } from "@/components/marketing/reveal";
import { Section, Eyebrow } from "./section";

export function BrandStory() {
  return (
    <Section>
      <div className="grid items-center gap-10 md:grid-cols-2">
        <Reveal>
          <Placeholder
            ratio="4/3"
            palette="olive"
            alt="Behind the Yamiriu atelier"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </Reveal>
        <Reveal delay={0.1}>
          <div>
            <Eyebrow>Our Story</Eyebrow>
            <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
              Italian craft, Pakistani heart
            </h2>
            <p className="mt-4 max-w-md text-ink/70">
              Yamiriu blends Italian-inspired tailoring with pieces made for how
              Pakistan actually dresses — considered fabrics, honest prices, and
              a fit you can preview before it arrives at your door.
            </p>
            <div className="mt-8">
              <ButtonLink href="/about" variant="secondary">
                Read our story
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
