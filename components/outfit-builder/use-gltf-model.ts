"use client";

import { useEffect, useState } from "react";
import type * as THREE from "three";
import { getGltfLoader } from "./gltf-loader";
import type { ModelLoadStatus } from "@/stores/outfit-builder";

export interface GltfModelResult {
  scene: THREE.Group | null;
  status: ModelLoadStatus;
}

/**
 * Loads a single .glb by URL, manually (not via drei's Suspense-based
 * useGLTF) so avatar and garment loading can each report independent
 * loading/error state — a Suspense boundary would tie a failing garment's
 * error to the whole scene, which conflicts with "never blocks the rest of
 * the builder" (PRD 4.4).
 */
export function useGltfModel(url: string | null, retryNonce = 0): GltfModelResult {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const [status, setStatus] = useState<ModelLoadStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!url) {
        setScene(null);
        setStatus("loading");
        return;
      }

      setStatus("loading");
      setScene(null);

      getGltfLoader().load(
        url,
        (gltf) => {
          if (cancelled) return;
          setScene(gltf.scene);
          setStatus("loaded");
        },
        undefined,
        () => {
          if (cancelled) return;
          setStatus("error");
        }
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [url, retryNonce]);

  return { scene, status };
}
