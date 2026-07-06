"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { reportError } from "@/lib/report-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { digest: error.digest });
  }, [error]);

  return (
    <main
      id="main-content"
      className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 text-center"
    >
      <p className="font-display text-5xl text-terracotta">Oh dear</p>
      <h1 className="font-display text-2xl text-ink">Something went wrong</h1>
      <p className="max-w-md text-ink/70">
        We hit an unexpected error. Please try again — if it keeps happening,
        come back in a little while.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Return home
        </ButtonLink>
      </div>
    </main>
  );
}
