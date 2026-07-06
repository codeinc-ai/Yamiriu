import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/marketing/page-header";
import { FounderNote } from "@/components/marketing/founder-note";
import { Placeholder } from "@/components/ui/placeholder";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "The story behind Yamiriu — an Italian-inspired clothing brand built for how Pakistan actually dresses.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="pb-24">
      <PageHeader
        eyebrow="About Yamiriu"
        title="Our Story"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Placeholder
          ratio="16/9"
          palette="olive"
          alt="The Yamiriu studio"
          sizes="(min-width: 768px) 48rem, 100vw"
        />

        <div className="mt-10 flex flex-col gap-5 text-ink/80">
          <p>
            Yamiriu began with a simple observation: Pakistan has no shortage
            of style, but it&apos;s rare to find clothing that pairs Italian
            tailoring sensibilities with fabrics and fits made for how people
            actually live and dress here. We set out to close that gap —
            considered pieces, honest pricing, and a shopping experience that
            respects your time.
          </p>
          <p>
            Every collection is designed around versatility: pieces you can
            build a look around rather than a single outfit you&apos;ll wear once.
            That&apos;s also why we built our{" "}
            <Link
              href="/outfit-builder"
              className="text-terracotta underline-offset-2 hover:underline"
            >
              3D Outfit Builder
            </Link>{" "}
            — so you can see how a top, bottom, and pair of shoes actually
            work together before you buy, not just imagine it.
          </p>

          <FounderNote>
            This section is a first draft — replace with your real founding
            story, the people behind Yamiriu, and what led you to start the
            brand. A photo of the founders or atelier works well here too.
          </FounderNote>

          <p className="mt-2">
            We&apos;re just getting started. Follow along on the{" "}
            <Link
              href="/journal"
              className="text-terracotta underline-offset-2 hover:underline"
            >
              Journal
            </Link>{" "}
            for styling notes and behind-the-scenes updates, browse the{" "}
            <Link
              href="/shop"
              className="text-terracotta underline-offset-2 hover:underline"
            >
              full collection
            </Link>
            , or{" "}
            <Link
              href="/contact"
              className="text-terracotta underline-offset-2 hover:underline"
            >
              say hello
            </Link>{" "}
            — we read every message.
          </p>
        </div>
      </div>
    </div>
  );
}
