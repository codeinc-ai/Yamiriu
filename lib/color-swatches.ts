/** Known seed-catalogue color names mapped to a swatch hex. Falls back to a
 * neutral gray for anything unmapped so new colors never break rendering. */
const COLOR_HEX: Record<string, string> = {
  White: "#f5f4f0",
  Black: "#1a1a1a",
  Charcoal: "#3a3a3a",
  Navy: "#1f2a44",
  Olive: "#6b6e4c",
  Terracotta: "#bc5b39",
  Brown: "#6b4a35",
  Cream: "#f0e9d8",
  Tan: "#c9a877",
  Gold: "#ac8968",
  Ivory: "#f4efe2",
  "Sky Blue": "#a9c8e0",
  Indigo: "#3d4a7a",
  Red: "#a23b34",
};

const FALLBACK_HEX = "#9c9c9c";

export function colorSwatchHex(colorName: string): string {
  return COLOR_HEX[colorName] ?? FALLBACK_HEX;
}
