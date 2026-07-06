import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbListJsonLd, articleJsonLd } from "@/lib/structured-data";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import {
  getJournalPostBySlug,
  getRelatedJournalPosts,
  getAllPublishedJournalSlugs,
} from "@/lib/queries/journal";
import { estimateReadingMinutes } from "@/lib/reading-time";

export async function generateStaticParams() {
  const slugs = await getAllPublishedJournalSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getJournalPostBySlug(slug);
  if (!post) return {};

  const description = post.excerpt ?? `${post.title} — Yamiriu Style Journal.`;
  return {
    title: post.title,
    description,
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: {
      title: post.title,
      description,
      url: `/journal/${post.slug}`,
      type: "article",
      images: [{ url: post.coverImageUrl || `/api/og?title=${encodeURIComponent(post.title)}` }],
    },
  };
}

export default async function JournalPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getJournalPostBySlug(slug);
  if (!post) notFound();

  const related = await getRelatedJournalPosts(post.category, post.id, 3);
  const readingMinutes = estimateReadingMinutes(post.content);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Journal", href: "/journal" },
    { label: post.title },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
      <JsonLd data={breadcrumbListJsonLd(breadcrumbItems, `/journal/${post.slug}`)} />
      <JsonLd
        data={articleJsonLd({
          title: post.title,
          description: post.excerpt,
          url: `/journal/${post.slug}`,
          imageUrl: post.coverImageUrl,
          authorName: post.authorName,
          publishedAt: post.publishedAt,
        })}
      />
      <Breadcrumbs items={breadcrumbItems} />

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          {post.category ? <Badge variant="terracotta">{post.category}</Badge> : null}
          <span className="text-xs text-ink/60">{readingMinutes} min read</span>
        </div>
        <h1 className="mt-3 font-display text-3xl text-ink sm:text-4xl">{post.title}</h1>
        <p className="mt-2 text-sm text-ink/60">
          {post.authorName ? `${post.authorName} · ` : ""}
          {post.publishedAt ? (
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}
            </time>
          ) : null}
        </p>
      </header>

      {post.coverImageUrl ? (
        <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-xl bg-ink/5">
          <Image src={post.coverImageUrl} alt={post.title} fill unoptimized priority sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
        </div>
      ) : null}

      {/* Sanitized at write time (actions/admin/content.ts, small safe
          allowlist) — safe to render as-is (S-011). */}
      <div
        className="prose prose-neutral mt-8 max-w-none text-ink/80 [&_a]:text-terracotta [&_a]:underline [&_h2]:font-display [&_h2]:text-ink [&_h3]:font-display [&_h3]:text-ink [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {related.length > 0 ? (
        <div className="mt-16 border-t border-ink/10 pt-10">
          <h2 className="font-display text-2xl text-ink">Related stories</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} href={`/journal/${r.slug}`} className="group block">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-ink/5">
                  {r.coverImageUrl ? (
                    <Image
                      src={r.coverImageUrl}
                      alt={r.title}
                      fill
                      unoptimized
                      sizes="31vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  ) : null}
                </div>
                <h3 className="mt-2 text-sm font-medium text-ink group-hover:underline">{r.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
