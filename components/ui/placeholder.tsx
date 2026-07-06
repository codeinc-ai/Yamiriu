import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Brand-tinted placeholder image. Renders a local data-URI SVG through
 * next/image (`unoptimized`, so it stays within the CSP `img-src data:` policy)
 * inside an aspect-ratio box that reserves layout space to prevent CLS. Swap the
 * `src` for real UploadThing/next-image assets later without layout change.
 */
type Palette = "cream" | "olive" | "terracotta" | "ink" | "gold";

const PALETTES: Record<Palette, [string, string, string]> = {
  // [from, to, textColor]
  cream: ["#efe7d8", "#ddd0b8", "#17140f66"],
  olive: ["#7c7f58", "#565839", "#f7f3ecaa"],
  terracotta: ["#c2643f", "#9c4227", "#f7f3ecaa"],
  ink: ["#2a251d", "#17140f", "#f7f3ec88"],
  gold: ["#cdae82", "#ac8968", "#17140f66"],
};

function buildSvg(
  w: number,
  h: number,
  from: string,
  to: string,
  textColor: string,
  label?: string
): string {
  const fontSize = Math.round(Math.min(w, h) / 12);
  const text = label
    ? `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" letter-spacing="3" fill="${textColor}">${label}</text>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/>${text}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Build a brand-tinted placeholder data-URI (for use as a next/image `src`). */
export function makePlaceholder(
  palette: Palette = "cream",
  label?: string,
  ratio = "4/3"
): string {
  const [from, to, textColor] = PALETTES[palette];
  const [rw, rh] = ratio.split("/").map((n) => Number(n) || 1);
  return buildSvg(rw * 120, rh * 120, from, to, textColor, label);
}

export interface PlaceholderProps {
  /** CSS aspect-ratio, e.g. "4/3", "3/4", "16/9", "1/1". */
  ratio?: string;
  label?: string;
  alt?: string;
  palette?: Palette;
  sizes?: string;
  priority?: boolean;
  rounded?: boolean;
  className?: string;
}

export function Placeholder({
  ratio = "4/3",
  label,
  alt,
  palette = "cream",
  sizes = "100vw",
  priority = false,
  rounded = true,
  className,
}: PlaceholderProps) {
  const [from, to, textColor] = PALETTES[palette];
  const [rw, rh] = ratio.split("/").map((n) => Number(n) || 1);
  const src = buildSvg(rw * 120, rh * 120, from, to, textColor, label);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-ink/5",
        rounded && "rounded-xl",
        className
      )}
      style={{ aspectRatio: `${rw} / ${rh}` }}
    >
      <Image
        src={src}
        alt={alt ?? label ?? ""}
        fill
        unoptimized
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
