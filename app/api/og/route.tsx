import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 200;

/**
 * Generic 1200×630 OG image generator (BLOCK 04) — referenced from
 * generateMetadata across dynamic routes (PDP, journal, lookbook, audience
 * pages) that don't have their own static opengraph-image.tsx file. Accepts
 * `?title=&description=`, both plain text (length-capped defensively —
 * this is untrusted query input rendered into an image, not HTML, so no
 * injection risk, just a size guard).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") ?? "Yamiriu").slice(0, MAX_TITLE_LENGTH);
  const description = searchParams.get("description")?.slice(0, MAX_DESCRIPTION_LENGTH);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f7f3ec",
          color: "#17140f",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 8, textTransform: "uppercase" }}>Yamiriu</div>
        <div
          style={{
            marginTop: 28,
            fontSize: title.length > 50 ? 48 : 64,
            fontWeight: 700,
            textAlign: "center",
            padding: "0 80px",
            display: "flex",
          }}
        >
          {title}
        </div>
        {description ? (
          <div
            style={{
              marginTop: 20,
              fontSize: 28,
              color: "#6b6e4c",
              textAlign: "center",
              padding: "0 100px",
              display: "flex",
            }}
          >
            {description}
          </div>
        ) : null}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
