import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/marketing/reveal";
import { formatPkr } from "@/lib/format";
import { getBestsellers } from "@/lib/queries/products";
import { getProductThumbnail } from "@/lib/product-images";
import { Section } from "./section";

export async function Bestsellers() {
  const products = await getBestsellers(6);
  if (products.length === 0) return null;

  return (
    <Section>
      <div className="flex items-end justify-between gap-4">
        <Reveal>
          <h2 className="font-display text-3xl text-ink">Bestsellers</h2>
        </Reveal>
        <Link
          href="/shop"
          className="shrink-0 text-sm text-terracotta hover:underline"
        >
          View all &rarr;
        </Link>
      </div>

      <ul className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:thin]">
        {products.map((product) => (
          <li
            key={product.id}
            className="w-[46%] shrink-0 snap-start sm:w-[31%] md:w-[23.5%]"
          >
            <Link href={`/product/${product.slug}`} className="group block">
              <div className="relative overflow-hidden rounded-xl bg-ink/5" style={{ aspectRatio: "3 / 4" }}>
                <Image
                  src={getProductThumbnail(product)}
                  alt={product.name}
                  fill
                  unoptimized
                  sizes="(min-width: 768px) 24vw, 46vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <span className="absolute left-3 top-3">
                  <Badge variant="gold">Bestseller</Badge>
                </span>
              </div>
              <h3 className="mt-3 text-sm font-medium text-ink">
                {product.name}
              </h3>
              <p className="mt-0.5 text-sm text-ink/70">
                {formatPkr(product.price)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
