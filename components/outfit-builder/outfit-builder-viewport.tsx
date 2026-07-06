"use client";

import dynamic from "next/dynamic";
import { useWebglSupport } from "@/hooks/use-webgl-support";
import { useOutfitBuilderStore } from "@/stores/outfit-builder";
import { Button } from "@/components/ui/button";
import { ViewportSkeleton } from "./viewport-skeleton";
import { Viewport2DFallback } from "./viewport-2d-fallback";

// The only place three/@react-three/fiber/drei ever get imported — code-split
// into their own chunk, loaded only once WebGL support is confirmed and this
// component actually mounts (PRD Rule 17).
const Viewport3D = dynamic(() => import("./viewport-3d"), {
  ssr: false,
  loading: () => <ViewportSkeleton />,
});

export function OutfitBuilderViewport() {
  const webgl = useWebglSupport();
  const avatarLoadStatus = useOutfitBuilderStore((s) => s.avatarLoadStatus);
  const retryAvatar = useOutfitBuilderStore((s) => s.retryAvatar);

  if (webgl === "checking") {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-cream">
        <ViewportSkeleton />
      </div>
    );
  }

  if (webgl === "unsupported") {
    return <Viewport2DFallback />;
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-cream">
      <Viewport3D />
      {avatarLoadStatus === "loading" ? (
        <div className="absolute inset-0">
          <ViewportSkeleton />
        </div>
      ) : null}
      {avatarLoadStatus === "error" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-cream text-center">
          <p className="text-sm text-ink/70">The avatar couldn&apos;t be loaded.</p>
          <Button type="button" size="sm" variant="secondary" onClick={retryAvatar}>
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  );
}
