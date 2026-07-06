"use client";

import { useTransition } from "react";
import { useQueryStates } from "nuqs";
import { shopSearchParams } from "@/lib/shop-params";
import { Button } from "@/components/ui/button";

/**
 * Cursor-based "Load more" (PRD Rule 13, FR-004 — never OFFSET). Uses
 * history: 'push' (unlike filter changes, which replace) so the browser back
 * button steps back through previously-viewed pages.
 */
export function PaginationLoadMore({ nextCursor }: { nextCursor: string }) {
  const [, setParams] = useQueryStates(shopSearchParams, { shallow: false });
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-10 flex justify-center">
      <Button
        variant="secondary"
        loading={pending}
        onClick={() =>
          startTransition(() => {
            void setParams({ cursor: nextCursor }, { history: "push" });
          })
        }
      >
        Load more
      </Button>
    </div>
  );
}
