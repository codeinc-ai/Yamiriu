import { ImageResponse } from "next/og";

export const alt = "Yamiriu Custom Outfit Builder";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
            fontSize: 64,
            fontWeight: 700,
            textAlign: "center",
            padding: "0 80px",
          }}
        >
          Custom Outfit Builder
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 28,
            color: "#6b6e4c",
            textAlign: "center",
            padding: "0 100px",
          }}
        >
          Mix tops, bottoms, shoes &amp; accessories in 3D
        </div>
      </div>
    ),
    { ...size }
  );
}
