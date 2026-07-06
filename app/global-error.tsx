"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/report-error";

// Replaces the root layout when it throws, so it renders its own html/body and
// uses inline styles (globals.css is not guaranteed to be applied here).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { digest: error.digest, scope: "global" });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f3ec",
          color: "#17140f",
          fontFamily: "Georgia, 'Times New Roman', serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>
            Something went wrong
          </h1>
          <p
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              color: "#6b6e4c",
              margin: "0 0 1.5rem",
            }}
          >
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              background: "#bc5b39",
              color: "#f7f3ec",
              border: "none",
              borderRadius: "6px",
              padding: "12px 24px",
              fontSize: "0.95rem",
              cursor: "pointer",
              minHeight: "44px",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
