import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/marketing/page-header";
import { ContactForm } from "@/components/contact/contact-form";
import { WHATSAPP_URL, WHATSAPP_NUMBER } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Reach Yamiriu on WhatsApp for the fastest response, or send us a message.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="pb-24">
      <PageHeader
        eyebrow="Get in Touch"
        title="Contact Us"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-xl border border-olive/30 bg-olive/10 p-5 transition-colors hover:bg-olive/15"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className="shrink-0 text-olive"
          >
            <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.16c-.24.68-1.4 1.3-1.93 1.35-.5.05-1.13.07-1.82-.11-.42-.14-.96-.31-1.65-.61-2.9-1.25-4.8-4.17-4.95-4.36-.14-.19-1.18-1.57-1.18-3s.75-2.13 1.02-2.42c.26-.29.57-.36.76-.36l.55.01c.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.14.12.31.02.5-.09.19-.14.31-.29.48-.14.17-.3.38-.43.51-.14.14-.29.29-.12.57.17.29.74 1.22 1.59 1.98 1.1.98 2.02 1.28 2.31 1.42.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.65-.14.26.09 1.69.8 1.98.94.29.14.48.22.55.34.07.12.07.68-.17 1.36Z" />
          </svg>
          <div>
            <p className="font-semibold text-ink">Chat with us on WhatsApp</p>
            <p className="text-sm text-ink/70">
              {WHATSAPP_NUMBER} — usually reply within a few hours
            </p>
          </div>
        </a>

        <div className="mt-10">
          <h2 className="font-display text-2xl text-ink">
            Or send us a message
          </h2>
          <p className="mt-2 text-sm text-ink/70">
            We reply by email, usually within 1-2 business days.
          </p>
          <div className="mt-5">
            <ContactForm />
          </div>
        </div>

        <p className="mt-10 text-sm text-ink/70">
          Looking for shipping or payment answers first? Check our{" "}
          <Link href="/faq" className="text-terracotta underline-offset-2 hover:underline">
            FAQ
          </Link>{" "}
          or our{" "}
          <Link href="/returns" className="text-terracotta underline-offset-2 hover:underline">
            Returns & Exchanges policy
          </Link>
          . Already placed an order?{" "}
          <Link
            href="/track-order"
            className="text-terracotta underline-offset-2 hover:underline"
          >
            Track it here
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
