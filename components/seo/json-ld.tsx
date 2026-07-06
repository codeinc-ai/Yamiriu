/**
 * Renders a JSON-LD structured-data block. `application/ld+json` is data, not
 * executable script, so it is safe under CSP.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
