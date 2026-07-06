import { TrackedButtonLink } from "@/components/ui/tracked-button-link";
import { Placeholder } from "@/components/ui/placeholder";
import { Reveal } from "@/components/marketing/reveal";
import { Section, Eyebrow } from "./section";

const POINTS = [
  "Pick an avatar — men, women, or kids",
  "Mix tops, bottoms, shoes & accessories",
  "Rotate 360°, then add the whole look to cart",
];

export function OutfitBuilderTeaser() {
  return (
    <div className="bg-ink/[0.03]">
      <Section>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <Reveal>
            <div>
              <Eyebrow>The Outfit Builder</Eyebrow>
              <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
                Style it in 3D before you buy
              </h2>
              <p className="mt-4 max-w-md text-ink/70">
                Our signature tool lets you build and visualize a full outfit on
                a customizable avatar — reducing guesswork and making shopping
                interactive.
              </p>
              <ul className="mt-6 space-y-2">
                {POINTS.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-sm text-ink/80"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-terracotta"
                    />
                    {point}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <TrackedButtonLink ctaLabel="outfit_builder_teaser_try_now" href="/outfit-builder" size="lg">
                  Try It Now
                </TrackedButtonLink>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <Placeholder
              ratio="4/3"
              palette="cream"
              label="3D Preview"
              alt="Outfit builder 3D preview"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </Reveal>
        </div>
      </Section>
    </div>
  );
}
