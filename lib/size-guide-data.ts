export interface SizeRow {
  local: string;
  eu: string;
  measurement: string;
}

export interface SizeTable {
  title: string;
  measurementLabel: string;
  rows: SizeRow[];
}

export interface CategorySizeGuide {
  category: "men" | "women" | "kids";
  label: string;
  tables: SizeTable[];
}

export const SIZE_GUIDES: CategorySizeGuide[] = [
  {
    category: "men",
    label: "Men",
    tables: [
      {
        title: "Tops & Jackets",
        measurementLabel: "Chest (in)",
        rows: [
          { local: "XS", eu: "44", measurement: "34–36" },
          { local: "S", eu: "46", measurement: "36–38" },
          { local: "M", eu: "48", measurement: "38–40" },
          { local: "L", eu: "50", measurement: "40–42" },
          { local: "XL", eu: "52", measurement: "42–44" },
          { local: "XXL", eu: "54", measurement: "44–46" },
        ],
      },
      {
        title: "Trousers",
        measurementLabel: "Waist (in)",
        rows: [
          { local: "28", eu: "44", measurement: "28" },
          { local: "30", eu: "46", measurement: "30" },
          { local: "32", eu: "48", measurement: "32" },
          { local: "34", eu: "50", measurement: "34" },
          { local: "36", eu: "52", measurement: "36" },
          { local: "38", eu: "54", measurement: "38" },
        ],
      },
      {
        title: "Shoes",
        measurementLabel: "Foot length (cm)",
        rows: [
          { local: "6", eu: "40", measurement: "25.4" },
          { local: "7", eu: "41", measurement: "26.0" },
          { local: "8", eu: "42", measurement: "26.7" },
          { local: "9", eu: "43", measurement: "27.3" },
          { local: "10", eu: "44", measurement: "27.9" },
          { local: "11", eu: "45", measurement: "28.6" },
        ],
      },
    ],
  },
  {
    category: "women",
    label: "Women",
    tables: [
      {
        title: "Tops & Blouses",
        measurementLabel: "Bust (in)",
        rows: [
          { local: "XS", eu: "36", measurement: "32–33" },
          { local: "S", eu: "38", measurement: "34–35" },
          { local: "M", eu: "40", measurement: "36–37" },
          { local: "L", eu: "42", measurement: "38–39" },
          { local: "XL", eu: "44", measurement: "40–41" },
        ],
      },
      {
        title: "Skirts & Trousers",
        measurementLabel: "Waist (in)",
        rows: [
          { local: "XS", eu: "36", measurement: "25–26" },
          { local: "S", eu: "38", measurement: "27–28" },
          { local: "M", eu: "40", measurement: "29–30" },
          { local: "L", eu: "42", measurement: "31–32" },
          { local: "XL", eu: "44", measurement: "33–34" },
        ],
      },
      {
        title: "Shoes",
        measurementLabel: "Foot length (cm)",
        rows: [
          { local: "3", eu: "36", measurement: "23.0" },
          { local: "4", eu: "37", measurement: "23.6" },
          { local: "5", eu: "38", measurement: "24.3" },
          { local: "6", eu: "39", measurement: "24.9" },
          { local: "7", eu: "40", measurement: "25.4" },
          { local: "8", eu: "41", measurement: "26.0" },
        ],
      },
    ],
  },
  {
    category: "kids",
    label: "Kids",
    tables: [
      {
        title: "Tops & Jackets",
        measurementLabel: "Height (cm)",
        rows: [
          { local: "2–3Y", eu: "92–98", measurement: "92–98" },
          { local: "4–5Y", eu: "104–110", measurement: "104–110" },
          { local: "6–7Y", eu: "116–122", measurement: "116–122" },
          { local: "8–9Y", eu: "128–134", measurement: "128–134" },
          { local: "10–11Y", eu: "140–146", measurement: "140–146" },
        ],
      },
      {
        title: "Bottoms",
        measurementLabel: "Height (cm)",
        rows: [
          { local: "2–3Y", eu: "92–98", measurement: "92–98" },
          { local: "4–5Y", eu: "104–110", measurement: "104–110" },
          { local: "6–7Y", eu: "116–122", measurement: "116–122" },
          { local: "8–9Y", eu: "128–134", measurement: "128–134" },
          { local: "10–11Y", eu: "140–146", measurement: "140–146" },
        ],
      },
      {
        title: "Shoes",
        measurementLabel: "Foot length (cm)",
        rows: [
          { local: "8", eu: "25", measurement: "15.5" },
          { local: "9", eu: "26", measurement: "16.0" },
          { local: "10", eu: "27", measurement: "16.7" },
          { local: "11", eu: "28", measurement: "17.3" },
          { local: "12", eu: "29", measurement: "17.9" },
          { local: "13", eu: "30", measurement: "18.5" },
        ],
      },
    ],
  },
];
