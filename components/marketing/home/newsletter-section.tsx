import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { Reveal } from "@/components/marketing/reveal";
import { Section, Eyebrow } from "./section";

export function NewsletterSection() {
  return (
    <div className="bg-ink/[0.03]">
      <Section className="text-center">
        <Reveal>
          <div className="mx-auto max-w-xl">
            <Eyebrow>Stay in the loop</Eyebrow>
            <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
              New arrivals & styling notes
            </h2>
            <p className="mt-3 text-ink/70">
              Be first to shop drops and get members-only offers. No spam — just
              the good stuff.
            </p>
            <NewsletterForm className="mx-auto mt-6 max-w-md" />
          </div>
        </Reveal>
      </Section>
    </div>
  );
}
