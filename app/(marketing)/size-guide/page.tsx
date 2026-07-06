import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/marketing/page-header";
import { SizeGuideTable } from "@/components/marketing/size-guide-table";
import { Accordion, type AccordionItem } from "@/components/ui/accordion";
import { SIZE_GUIDES } from "@/lib/size-guide-data";

export const metadata: Metadata = {
  title: "Size Guide",
  description:
    "Convert EU/Italian sizing to Pakistani sizing for men's, women's, and kids' tops, bottoms, and shoes.",
  alternates: { canonical: "/size-guide" },
};

export default function SizeGuidePage() {
  const items: AccordionItem[] = SIZE_GUIDES.map((guide) => ({
    value: guide.category,
    trigger: guide.label,
    content: (
      <div className="flex flex-col gap-8 py-2">
        {guide.tables.map((table) => (
          <SizeGuideTable key={table.title} table={table} />
        ))}
      </div>
    ),
  }));

  return (
    <div className="pb-24">
      <PageHeader
        eyebrow="Fit & Sizing"
        title="Size Guide"
        description="Measurements are approximate — if you're between sizes, we generally recommend sizing up. Still unsure? Message us on WhatsApp with your usual size and we'll help you pick."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Size Guide" },
        ]}
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Accordion items={items} defaultValue="men" />

        <p className="mt-8 text-sm text-ink/70">
          Ready to shop? Head to the{" "}
          <Link href="/shop" className="text-terracotta underline-offset-2 hover:underline">
            full collection
          </Link>
          , try pieces on virtually in the{" "}
          <Link
            href="/outfit-builder"
            className="text-terracotta underline-offset-2 hover:underline"
          >
            Outfit Builder
          </Link>
          , or check our{" "}
          <Link href="/faq" className="text-terracotta underline-offset-2 hover:underline">
            FAQ
          </Link>{" "}
          for more on shipping and returns.
        </p>
      </div>
    </div>
  );
}
