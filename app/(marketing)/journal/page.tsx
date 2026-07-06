import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbListJsonLd } from "@/lib/structured-data";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { getPublishedJournalPosts, getJournalCategories } from "@/lib/queries/journal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Style Journal",
  description:
    "The Yamiriu Style Journal — tailoring notes, styling guides, and stories from the atelier.",
  alternates: { canonical: "/journal" },
  openGraph: {
    title: "Style Journal | Yamiriu",
    description: "Tailoring notes, styling guides, and stories from the atelier.",
    url: "/journal",
    images: [{ url: "/api/og?title=Style%20Journal&description=Tailoring%20notes%20and%20stories" }],
  },
};

const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Journal" }];

export default async function JournalIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [posts, categories] = await Promise.all([
    getPublishedJournalPosts(category),
    getJournalCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
      <JsonLd data={breadcrumbListJsonLd(breadcrumbItems, "/journal")} />
      <Breadcrumbs items={breadcrumbItems} />

      <h1 className="mt-4 font-display text-4xl text-ink sm:text-5xl">Style Journal</h1>
      <p className="mt-3 max-w-2xl text-ink/70">
        Tailoring notes, styling guides, and stories from the atelier.
      </p>

      {categories.length > 0 ? (
        <nav aria-label="Categories" className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/journal"
            className={cn(
              "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
              !category ? "bg-ink text-cream" : "bg-ink/5 text-ink/70 hover:bg-ink/10"
            )}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/journal?category=${encodeURIComponent(cat)}`}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                category === cat ? "bg-ink text-cream" : "bg-ink/5 text-ink/70 hover:bg-ink/10"
              )}
            >
              {cat}
            </Link>
          ))}
        </nav>
      ) : null}

      {posts.length === 0 ? (
        <p className="mt-12 text-sm text-ink/60">New stories are on the way — check back soon.</p>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/journal/${post.slug}`} className="group block">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-ink/5">
                {post.coverImageUrl ? (
                  <Image
                    src={post.coverImageUrl}
                    alt={post.title}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                ) : null}
              </div>
              <div className="mt-3 flex items-center gap-2">
                {post.category ? <Badge variant="terracotta">{post.category}</Badge> : null}
                {post.publishedAt ? (
                  <time dateTime={post.publishedAt} className="text-xs text-ink/60">
                    {new Date(post.publishedAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}
                  </time>
                ) : null}
              </div>
              <h2 className="mt-2 font-display text-lg text-ink group-hover:underline">{post.title}</h2>
              {post.excerpt ? <p className="mt-1 text-sm text-ink/60">{post.excerpt}</p> : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
