// Unambiguous alphabet (no 0/O/1/I) for human-read/typed order numbers.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** Generates a short, human-friendly public order identifier, e.g. "YAM-7F3K9Q".
 * Never expose the internal UUID `orders.id` in customer-facing contexts
 * (PRD Rule 10) — this is what customers reference for track-order lookups. */
export function generateOrderNumber(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `YAM-${code}`;
}
