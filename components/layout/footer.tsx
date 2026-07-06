import Link from "next/link";
import {
  FOOTER_COLUMNS,
  SOCIAL_LINKS,
  PAYMENT_METHODS,
  WHATSAPP_URL,
  WHATSAPP_NUMBER,
} from "@/lib/site-config";
import { NewsletterForm } from "@/components/marketing/newsletter-form";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink/10 bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          {/* Brand + newsletter */}
          <div className="col-span-2">
            <p className="font-display text-2xl font-bold uppercase tracking-[0.2em] text-ink">
              Yamiriu
            </p>
            <p className="mt-3 max-w-xs text-sm text-ink/70">
              Italian style, made yours. Build your look, then make it yours —
              shipping across Pakistan.
            </p>
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-ink">
                Join the newsletter
              </p>
              <NewsletterForm className="max-w-sm" />
            </div>
          </div>

          {/* Nav columns */}
          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-semibold text-ink">{column.title}</h2>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink/70 transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-ink/10 pt-8 md:flex-row md:items-center md:justify-between">
          {/* Payment methods */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="sr-only">Accepted payment methods</span>
            {PAYMENT_METHODS.map((method) => (
              <span
                key={method}
                className="rounded border border-ink/15 bg-white px-2.5 py-1 text-xs font-medium text-ink/70"
              >
                {method}
              </span>
            ))}
          </div>

          {/* WhatsApp + socials */}
          <div className="flex flex-wrap items-center gap-5">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-ink/80 transition-colors hover:text-ink"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                className="text-olive"
              >
                <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.16c-.24.68-1.4 1.3-1.93 1.35-.5.05-1.13.07-1.82-.11-.42-.14-.96-.31-1.65-.61-2.9-1.25-4.8-4.17-4.95-4.36-.14-.19-1.18-1.57-1.18-3s.75-2.13 1.02-2.42c.26-.29.57-.36.76-.36l.55.01c.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.14.12.31.02.5-.09.19-.14.31-.29.48-.14.17-.3.38-.43.51-.14.14-.29.29-.12.57.17.29.74 1.22 1.59 1.98 1.1.98 2.02 1.28 2.31 1.42.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.65-.14.26.09 1.69.8 1.98.94.29.14.48.22.55.34.07.12.07.68-.17 1.36Z" />
              </svg>
              WhatsApp {WHATSAPP_NUMBER}
            </a>
            <ul className="flex items-center gap-4">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.href}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-ink/70 transition-colors hover:text-ink"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-8 text-xs text-ink/60">
          © {new Date().getFullYear()} Yamiriu. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
