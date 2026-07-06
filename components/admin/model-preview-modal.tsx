"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ModelPreviewViewport } from "./model-preview-viewport";
import type { ShopCategory } from "@/lib/categories";

/** Lets staff verify a garment model on its avatar before publishing (PRD
 * 4.8.4) — reused by the product form and /admin/outfit-assets. */
export function ModelPreviewButton({
  category,
  modelUrl,
  label = "Preview on avatar",
}: {
  category: ShopCategory;
  modelUrl: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="3D Preview" className="max-w-md">
        {open ? <ModelPreviewViewport category={category} modelUrl={modelUrl} /> : null}
      </Modal>
    </>
  );
}
