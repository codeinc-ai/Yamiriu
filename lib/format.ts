/** Format a PKR amount (accepts the numeric-as-string values Drizzle returns). */
export function formatPkr(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  return `Rs ${n.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}
