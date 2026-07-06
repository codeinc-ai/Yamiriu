import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/marketing/page-header";

export const metadata: Metadata = {
  title: "Returns & Exchanges",
  description:
    "Yamiriu's returns and exchange policy — return window, condition requirements, and how to start a return.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <div className="pb-24">
      <PageHeader
        eyebrow="Support"
        title="Returns & Exchanges"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Returns" }]}
      />

      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 text-ink/80 sm:px-6">
        <section>
          <h2 className="font-display text-2xl text-ink">Return window</h2>
          <p className="mt-3">
            You may return or exchange unworn items within 7 days of delivery.
            Items must be unworn, unwashed, and have all original tags
            attached. We recommend trying items on over your existing
            clothing to keep tags intact.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-ink">
            What can&apos;t be returned
          </h2>
          <ul className="mt-3 list-inside list-disc space-y-1.5">
            <li>Items marked &quot;Final Sale&quot; at checkout</li>
            <li>Innerwear and accessories, for hygiene reasons</li>
            <li>Items showing signs of wear, alteration, or washing</li>
            <li>Gift cards</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl text-ink">
            How to start a return
          </h2>
          <ol className="mt-3 list-inside list-decimal space-y-1.5">
            <li>
              Sign in and open the order from{" "}
              <Link
                href="/account/orders"
                className="text-terracotta underline-offset-2 hover:underline"
              >
                your order history
              </Link>
              , or message us on WhatsApp with your order number if you
              checked out as a guest.
            </li>
            <li>Tell us which item(s) you&apos;d like to return and why.</li>
            <li>
              We&apos;ll confirm approval and send pickup or drop-off
              instructions.
            </li>
            <li>
              Once we receive and inspect the item, your refund or exchange
              is processed within 3-5 business days.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-2xl text-ink">Refund method</h2>
          <p className="mt-3">
            Refunds are issued to your original payment method (JazzCash,
            Easypaisa, card) where possible, or as store credit on request.
            Cash on Delivery orders are refunded via bank transfer or store
            credit.
          </p>
        </section>

        <p className="text-sm text-ink/70">
          Not sure if an item qualifies, or unsure what size to reorder? Check
          our{" "}
          <Link href="/size-guide" className="text-terracotta underline-offset-2 hover:underline">
            Size Guide
          </Link>
          , browse the{" "}
          <Link href="/faq" className="text-terracotta underline-offset-2 hover:underline">
            FAQ
          </Link>
          , or{" "}
          <Link href="/contact" className="text-terracotta underline-offset-2 hover:underline">
            contact us
          </Link>{" "}
          directly and we&apos;ll help.
        </p>
      </div>
    </div>
  );
}
