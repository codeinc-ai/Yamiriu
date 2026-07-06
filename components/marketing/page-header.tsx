import { Breadcrumbs, type BreadcrumbItem } from "@/components/shop/breadcrumbs";

/** Shared header for static content pages: breadcrumbs + single H1 (+ optional
 * eyebrow), consistent brand styling across /about, /faq, /returns, etc. */
export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-14 sm:px-6 sm:pt-20">
      <Breadcrumbs items={breadcrumbs} />
      {eyebrow ? (
        <p className="mt-6 text-sm uppercase tracking-[0.2em] text-terracotta">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-4 text-ink/70">{description}</p>
      ) : null}
    </div>
  );
}
