import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/marketing/page-header";
import { FounderNote } from "@/components/marketing/founder-note";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions for shopping with Yamiriu.",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "July 5, 2026";

export default function TermsPage() {
  return (
    <div className="pb-24">
      <PageHeader
        eyebrow="Legal"
        title="Terms of Service"
        description={`Last updated ${LAST_UPDATED}.`}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Terms" }]}
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <FounderNote>
          This draft covers standard e-commerce terms but has not been
          reviewed by a lawyer. Have it checked against Pakistan&apos;s consumer
          protection and e-commerce regulations before publishing.
        </FounderNote>

        <div className="mt-8 flex flex-col gap-8 text-ink/80">
          <section>
            <h2 className="font-display text-2xl text-ink">
              Acceptance of terms
            </h2>
            <p className="mt-3">
              By using yamiriu.com or placing an order, you agree to these
              terms. If you don&apos;t agree, please don&apos;t use the site.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">
              Orders & pricing
            </h2>
            <p className="mt-3">
              All prices are listed in Pakistani Rupees (PKR) and include
              applicable taxes unless stated otherwise. We reserve the right
              to correct pricing or listing errors and to cancel orders
              affected by them, with a full refund. Placing an order is an
              offer to purchase; we confirm acceptance once payment is
              verified (or, for Cash on Delivery, once the order is
              confirmed).
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">
              Payment methods
            </h2>
            <p className="mt-3">
              We accept JazzCash, Easypaisa, bank transfer, card payments,
              and Cash on Delivery (on eligible orders). Bank transfer orders
              are held pending manual confirmation. Repeated refused or
              undelivered Cash on Delivery orders may result in COD being
              unavailable on future orders.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">
              Shipping & delivery
            </h2>
            <p className="mt-3">
              We currently ship within Pakistan only. Delivery estimates
              shown at checkout and on our{" "}
              <Link href="/faq" className="text-terracotta underline-offset-2 hover:underline">
                FAQ page
              </Link>{" "}
              are estimates, not guarantees.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">
              Returns & exchanges
            </h2>
            <p className="mt-3">
              See our{" "}
              <Link href="/returns" className="text-terracotta underline-offset-2 hover:underline">
                Returns & Exchanges policy
              </Link>{" "}
              for the return window and process.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">
              Intellectual property
            </h2>
            <p className="mt-3">
              All content on this site — including photography, the Outfit
              Builder, and the Yamiriu name and logo — is owned by Yamiriu or
              its licensors and may not be reproduced without permission.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">
              Limitation of liability
            </h2>
            <p className="mt-3">
              Yamiriu is not liable for indirect or consequential losses
              arising from use of the site, to the fullest extent permitted
              by law. Nothing in these terms limits liability that cannot be
              excluded under applicable law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Governing law</h2>
            <p className="mt-3">
              These terms are governed by the laws of Pakistan, and disputes
              will be subject to the exclusive jurisdiction of the courts of
              Pakistan.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">
              Changes to these terms
            </h2>
            <p className="mt-3">
              We may update these terms from time to time; the &quot;last
              updated&quot; date above reflects the most recent revision.
            </p>
          </section>

          <p className="text-sm text-ink/70">
            Questions about these terms? Visit our{" "}
            <Link href="/contact" className="text-terracotta underline-offset-2 hover:underline">
              Contact page
            </Link>{" "}
            or review our{" "}
            <Link href="/privacy" className="text-terracotta underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
