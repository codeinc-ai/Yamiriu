"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FilterPanel } from "./filter-panel";
import type { ProductFacets } from "@/lib/shop-types";

export function FilterSidebar({ facets }: { facets: ProductFacets }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop: persistent sidebar */}
      <aside className="hidden w-64 shrink-0 md:block">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">
          Filters
        </h2>
        <div className="mt-4">
          <FilterPanel facets={facets} />
        </div>
      </aside>

      {/* Mobile: button opening a modal */}
      <div className="md:hidden">
        <Button variant="secondary" onClick={() => setMobileOpen(true)}>
          Filters
        </Button>
      </div>
      <Modal
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title="Filters"
      >
        <FilterPanel facets={facets} />
        <Button className="mt-6 w-full" onClick={() => setMobileOpen(false)}>
          Show results
        </Button>
      </Modal>
    </>
  );
}
