import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/marketing/page-header";
import { FounderNote } from "@/components/marketing/founder-note";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Yamiriu collects, uses, and protects your personal data.",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "July 5, 2026";

export default function PrivacyPage() {
  return (
    <div className="pb-24">
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description={`Last updated ${LAST_UPDATED}.`}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Privacy" }]}
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <FounderNote>
          This draft covers the essentials but has not been reviewed by a
          lawyer. Have it checked against Pakistan&apos;s data-protection
          requirements and your actual data flows before publishing.
        </FounderNote>

        <div className="mt-8 flex flex-col gap-8 text-ink/80">
          <section>
            <h2 className="font-display text-2xl text-ink">
              Information we collect
            </h2>
            <p className="mt-3">
              When you create an account, place an order, or contact us, we
              collect information such as your name, email, phone number,
              shipping address, and order history. If you check out as a
              guest, we only keep what&apos;s needed to fulfill and support that
              order. We also collect basic usage data (pages viewed, device
              type) via analytics, identified only by an anonymous user ID —
              never your name or email.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">
              How we use your information
            </h2>
            <ul className="mt-3 list-inside list-disc space-y-1.5">
              <li>Processing and delivering your orders</li>
              <li>
                Sending order confirmations, shipping updates, and (with your
                consent) marketing emails
              </li>
              <li>Responding to support requests</li>
              <li>Preventing fraud, including Cash on Delivery abuse</li>
              <li>Improving the site based on aggregate usage patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">
              Who we share it with
            </h2>
            <p className="mt-3">
              We share only what&apos;s necessary with payment processors
              (JazzCash, Easypaisa, our card gateway), courier partners for
              delivery, and service providers who help us run the site
              (email delivery, error monitoring, analytics, fraud/rate-limit
              protection). These providers only receive what they need to do
              their job and are not permitted to use your data for their own
              purposes. We never sell your personal information.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">
              Cookies & local storage
            </h2>
            <p className="mt-3">
              We use a secure, httpOnly session cookie to keep you signed in
              — it&apos;s never accessible to page scripts. Your shopping cart is
              stored in your browser&apos;s local storage so it persists between
              visits; it never contains authentication data.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Your rights</h2>
            <p className="mt-3">
              You can access, correct, or delete your account data at any
              time from your account settings, or by contacting us. When you
              delete your account, we remove your personal information
              immediately; order records are retained in anonymized form for
              accounting and legal compliance.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">
              Changes to this policy
            </h2>
            <p className="mt-3">
              We&apos;ll update the &quot;last updated&quot; date above whenever this policy
              changes and post material changes prominently.
            </p>
          </section>

          <p className="text-sm text-ink/70">
            Questions about your data? See our{" "}
            <Link href="/contact" className="text-terracotta underline-offset-2 hover:underline">
              Contact page
            </Link>{" "}
            or read our{" "}
            <Link href="/terms" className="text-terracotta underline-offset-2 hover:underline">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
