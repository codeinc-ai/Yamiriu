import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/marketing/page-header";
import { TrackOrderForm } from "@/components/track-order/track-order-form";

export const metadata: Metadata = {
  title: "Track Your Order",
  description:
    "Look up your Yamiriu order status using your order number and email.",
  alternates: { canonical: "/track-order" },
};

export default function TrackOrderPage() {
  return (
    <div className="pb-24">
      <PageHeader
        eyebrow="Support"
        title="Track Your Order"
        description="Enter your order number and the email you used at checkout — both from your confirmation email or WhatsApp message."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Track Order" }]}
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <TrackOrderForm />

        <p className="mt-10 text-sm text-ink/70">
          Can&apos;t find your order number? Check our{" "}
          <Link href="/faq" className="text-terracotta underline-offset-2 hover:underline">
            FAQ
          </Link>{" "}
          or{" "}
          <Link href="/contact" className="text-terracotta underline-offset-2 hover:underline">
            contact us
          </Link>{" "}
          on WhatsApp with the phone number or email used at checkout.
        </p>
      </div>
    </div>
  );
}
