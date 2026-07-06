import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/marketing/page-header";
import { Accordion, type AccordionItem } from "@/components/ui/accordion";
import { JsonLd } from "@/components/seo/json-ld";
import { faqPageJsonLd } from "@/lib/structured-data";
import { FAQ_ITEMS } from "@/lib/faq-data";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about shipping, Cash on Delivery, JazzCash/Easypaisa payments, returns, and the Outfit Builder.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  const items: AccordionItem[] = FAQ_ITEMS.map((item, i) => ({
    value: `faq-${i}`,
    trigger: item.question,
    content: <p>{item.answer}</p>,
  }));

  return (
    <div className="pb-24">
      <JsonLd data={faqPageJsonLd(FAQ_ITEMS)} />
      <PageHeader
        eyebrow="Support"
        title="Frequently Asked Questions"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Accordion items={items} />

        <p className="mt-8 text-sm text-ink/70">
          Can&apos;t find what you&apos;re looking for? Reach us on{" "}
          <Link href="/contact" className="text-terracotta underline-offset-2 hover:underline">
            our Contact page
          </Link>
          , check the{" "}
          <Link href="/returns" className="text-terracotta underline-offset-2 hover:underline">
            Returns & Exchanges policy
          </Link>
          , or{" "}
          <Link
            href="/track-order"
            className="text-terracotta underline-offset-2 hover:underline"
          >
            track an existing order
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
