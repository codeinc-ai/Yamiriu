"use client";

import { uploadFiles } from "@/lib/uploadthing";
import { reportError } from "@/lib/report-error";
import { getProductThumbnail } from "@/lib/product-images";
import { useOutfitBuilderStore, type OutfitItem } from "@/stores/outfit-builder";
import type { OutfitSlot } from "@/lib/queries/outfit-builder";

// Mirrors viewport-2d-fallback.tsx's LAYER_STYLE exactly, expressed as
// [x, y, w, h] fractions of the canvas instead of CSS percentages.
const LAYER_ORDER: OutfitSlot[] = ["bottom", "shoes", "top", "accessory_jacket"];
const LAYER_BOX: Record<OutfitSlot, [number, number, number, number]> = {
  top: [0.2, 0.05, 0.6, 0.36],
  bottom: [0.26, 0.36, 0.48, 0.36],
  shoes: [0.3, 0.7, 0.4, 0.22],
  accessory_jacket: [0.71, 0.03, 0.26, 0.26],
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Composites the same flat-lay layout as viewport-2d-fallback.tsx onto an
 * offscreen canvas — used when there's no live WebGL canvas to capture. */
export async function composeFlatLayThumbnail(
  selections: Partial<Record<OutfitSlot, OutfitItem>>
): Promise<string | null> {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#f7f3ec";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const slot of LAYER_ORDER) {
    const item = selections[slot];
    if (!item) continue;
    const [xf, yf, wf, hf] = LAYER_BOX[slot];
    try {
      const img = await loadImage(getProductThumbnail(item));
      ctx.drawImage(img, xf * canvas.width, yf * canvas.height, wf * canvas.width, hf * canvas.height);
    } catch {
      // Skip this one item's image rather than aborting the whole composite.
    }
  }

  return canvas.toDataURL("image/png");
}

/** Picks the live 3D canvas (if mounted) or the 2D flat-lay composite,
 * whichever mode the builder is actually in. */
export async function captureCurrentThumbnailDataUrl(): Promise<string | null> {
  const state = useOutfitBuilderStore.getState();
  if (state.canvasCaptureFn) {
    return state.canvasCaptureFn();
  }
  return composeFlatLayThumbnail(state.selections);
}

async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || "image/png" });
}

/**
 * Best-effort: upload a captured thumbnail via UploadThing. Never throws — a
 * missing/failed thumbnail must never block saving the outfit itself.
 */
export async function uploadOutfitThumbnail(dataUrl: string | null): Promise<string | null> {
  if (!dataUrl) return null;
  try {
    const file = await dataUrlToFile(dataUrl, "outfit-thumbnail.png");
    const result = await uploadFiles("outfitThumbnail", { files: [file] });
    return result[0]?.ufsUrl ?? null;
  } catch (error) {
    reportError(error, { stage: "outfit_thumbnail_upload" });
    return null;
  }
}
