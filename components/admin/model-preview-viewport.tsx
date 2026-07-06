"use client";

import dynamic from "next/dynamic";
import { useWebglSupport } from "@/hooks/use-webgl-support";
import { ViewportSkeleton } from "@/components/outfit-builder/viewport-skeleton";
import type { ShopCategory } from "@/lib/categories";

const ModelPreviewCanvas = dynamic(() => import("./model-preview-canvas"), {
  ssr: false,
  loading: () => <ViewportSkeleton />,
});

export function ModelPreviewViewport({
  category,
  modelUrl,
}: {
  category: ShopCategory;
  modelUrl: string;
}) {
  const webgl = useWebglSupport();

  if (webgl === "unsupported") {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-cream text-center text-sm text-ink/60">
        3D preview isn&apos;t supported in this browser.
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-cream">
      {webgl === "checking" ? <ViewportSkeleton /> : <ModelPreviewCanvas category={category} modelUrl={modelUrl} />}
    </div>
  );
}
