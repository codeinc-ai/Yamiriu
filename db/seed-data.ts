export type SeedVariant = {
  size: string;
  color: string;
  stock: number;
  sku: string;
};

export type SeedProduct = {
  slug: string;
  name: string;
  description: string;
  price: string;
  category: "men" | "women" | "kids";
  itemType: "top" | "bottom" | "shoes" | "accessory" | "jacket";
  hasModel: boolean;
  modelUrl?: string;
  /** Demo-only popularity signal driving the "bestselling" sort. */
  salesCount: number;
  variants: SeedVariant[];
};

export const seedProducts: SeedProduct[] = [
  {
    slug: "milano-linen-shirt",
    name: "Milano Linen Shirt",
    description: "Breathable Italian linen shirt with a relaxed, tailored cut.",
    price: "6500.00",
    category: "men",
    itemType: "top",
    hasModel: true,
    modelUrl: "/models/men/milano-linen-shirt.glb",
    salesCount: 342,
    variants: [
      { size: "M", color: "White", stock: 20, sku: "MLS-M-WHT" },
      { size: "L", color: "White", stock: 15, sku: "MLS-L-WHT" },
      { size: "L", color: "Terracotta", stock: 10, sku: "MLS-L-TER" },
    ],
  },
  {
    slug: "roma-tailored-trousers",
    name: "Roma Tailored Trousers",
    description: "Slim-fit tailored trousers cut from Italian wool blend.",
    price: "8500.00",
    category: "men",
    itemType: "bottom",
    hasModel: true,
    modelUrl: "/models/men/roma-tailored-trousers.glb",
    salesCount: 210,
    variants: [
      { size: "32", color: "Charcoal", stock: 18, sku: "RTT-32-CHA" },
      { size: "34", color: "Charcoal", stock: 12, sku: "RTT-34-CHA" },
      { size: "34", color: "Olive", stock: 8, sku: "RTT-34-OLV" },
    ],
  },
  {
    slug: "napoli-leather-loafers",
    name: "Napoli Leather Loafers",
    description: "Hand-finished leather loafers with a classic Neapolitan last.",
    price: "12500.00",
    category: "men",
    itemType: "shoes",
    hasModel: false,
    salesCount: 156,
    variants: [
      { size: "42", color: "Brown", stock: 10, sku: "NLL-42-BRN" },
      { size: "43", color: "Brown", stock: 10, sku: "NLL-43-BRN" },
      { size: "43", color: "Black", stock: 0, sku: "NLL-43-BLK" },
      { size: "44", color: "Black", stock: 5, sku: "NLL-44-BLK" },
    ],
  },
  {
    slug: "torino-wool-blazer",
    name: "Torino Wool Blazer",
    description: "Structured single-breasted blazer in soft merino wool.",
    price: "19500.00",
    category: "men",
    itemType: "jacket",
    hasModel: true,
    modelUrl: "/models/men/torino-wool-blazer.glb",
    salesCount: 88,
    variants: [
      { size: "M", color: "Navy", stock: 8, sku: "TWB-M-NVY" },
      { size: "L", color: "Navy", stock: 8, sku: "TWB-L-NVY" },
    ],
  },
  {
    slug: "firenze-silk-blouse",
    name: "Firenze Silk Blouse",
    description: "Fluid silk blouse with mother-of-pearl buttons.",
    price: "7500.00",
    category: "women",
    itemType: "top",
    hasModel: true,
    modelUrl: "/models/women/firenze-silk-blouse.glb",
    salesCount: 275,
    variants: [
      { size: "S", color: "Cream", stock: 16, sku: "FSB-S-CRM" },
      { size: "M", color: "Cream", stock: 14, sku: "FSB-M-CRM" },
      { size: "M", color: "Terracotta", stock: 9, sku: "FSB-M-TER" },
    ],
  },
  {
    slug: "verona-pleated-skirt",
    name: "Verona Pleated Skirt",
    description: "Midi-length pleated skirt in a fluid crepe fabric.",
    price: "6900.00",
    category: "women",
    itemType: "bottom",
    hasModel: true,
    modelUrl: "/models/women/verona-pleated-skirt.glb",
    salesCount: 198,
    variants: [
      { size: "S", color: "Olive", stock: 12, sku: "VPS-S-OLV" },
      { size: "M", color: "Olive", stock: 12, sku: "VPS-M-OLV" },
      { size: "M", color: "Black", stock: 10, sku: "VPS-M-BLK" },
    ],
  },
  {
    slug: "capri-strap-sandals",
    name: "Capri Strap Sandals",
    description: "Woven leather strap sandals with a low block heel.",
    price: "8900.00",
    category: "women",
    itemType: "shoes",
    hasModel: false,
    salesCount: 64,
    variants: [
      { size: "37", color: "Tan", stock: 10, sku: "CSS-37-TAN" },
      { size: "38", color: "Tan", stock: 10, sku: "CSS-38-TAN" },
      { size: "38", color: "Black", stock: 6, sku: "CSS-38-BLK" },
    ],
  },
  {
    slug: "como-cashmere-scarf",
    name: "Como Cashmere Scarf",
    description: "Lightweight cashmere scarf woven on Lake Como looms.",
    price: "5500.00",
    category: "women",
    itemType: "accessory",
    hasModel: false,
    salesCount: 40,
    // Deliberately sold out (both variants at 0) to exercise the
    // "in stock only" availability filter, which should exclude this product.
    variants: [
      { size: "One Size", color: "Gold", stock: 0, sku: "CCS-OS-GLD" },
      { size: "One Size", color: "Ivory", stock: 0, sku: "CCS-OS-IVY" },
    ],
  },
  {
    slug: "piccolo-cotton-tee",
    name: "Piccolo Cotton Tee",
    description: "Soft organic cotton tee for everyday play.",
    price: "2900.00",
    category: "kids",
    itemType: "top",
    hasModel: false,
    salesCount: 133,
    variants: [
      { size: "4Y", color: "White", stock: 20, sku: "PCT-4-WHT" },
      { size: "6Y", color: "White", stock: 20, sku: "PCT-6-WHT" },
      { size: "6Y", color: "Sky Blue", stock: 15, sku: "PCT-6-SKY" },
    ],
  },
  {
    slug: "bambino-denim-shorts",
    name: "Bambino Denim Shorts",
    description: "Durable denim shorts with an adjustable waistband.",
    price: "3400.00",
    category: "kids",
    itemType: "bottom",
    hasModel: false,
    salesCount: 52,
    variants: [
      { size: "4Y", color: "Indigo", stock: 18, sku: "BDS-4-IND" },
      { size: "6Y", color: "Indigo", stock: 18, sku: "BDS-6-IND" },
    ],
  },
  {
    slug: "junior-canvas-sneakers",
    name: "Junior Canvas Sneakers",
    description: "Lightweight canvas sneakers with a grippy rubber sole.",
    price: "4200.00",
    category: "kids",
    itemType: "shoes",
    hasModel: false,
    salesCount: 121,
    variants: [
      { size: "28", color: "Red", stock: 12, sku: "JCS-28-RED" },
      { size: "30", color: "Red", stock: 12, sku: "JCS-30-RED" },
      { size: "30", color: "Navy", stock: 8, sku: "JCS-30-NVY" },
    ],
  },
  {
    slug: "mini-wool-cardigan",
    name: "Mini Wool Cardigan",
    description: "Cozy button-front cardigan in a soft wool blend.",
    price: "5200.00",
    category: "kids",
    itemType: "jacket",
    hasModel: false,
    salesCount: 30,
    variants: [
      { size: "4Y", color: "Olive", stock: 10, sku: "MWC-4-OLV" },
      { size: "6Y", color: "Olive", stock: 10, sku: "MWC-6-OLV" },
    ],
  },
];
