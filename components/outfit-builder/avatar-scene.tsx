"use client";

import { useEffect } from "react";
import { useGltfModel } from "./use-gltf-model";
import { useOutfitBuilderStore, type OutfitItem } from "@/stores/outfit-builder";
import type { OutfitSlot } from "@/lib/queries/outfit-builder";
import { AVATAR_MODEL_URLS } from "@/lib/outfit-builder-config";
import { reportError } from "@/lib/report-error";

/**
 * Garments are never re-posed or bone-bound at runtime — each is authored
 * against the same reference avatar (scale/origin/pose) and simply parented
 * to the avatar's root at identity transform (see 3D-ASSET-SPEC.md). Nesting
 * this inside the <primitive object={avatarScene}> JSX below is what makes
 * R3F actually attach it as a child in the three.js scene graph.
 */
function GarmentAttachment({
  slot,
  item,
}: {
  slot: OutfitSlot;
  item: OutfitItem;
}) {
  const retryNonce = useOutfitBuilderStore((s) => s.garmentLoad[slot]?.retryNonce ?? 0);
  const setGarmentLoadStatus = useOutfitBuilderStore((s) => s.setGarmentLoadStatus);
  const { scene, status } = useGltfModel(item.modelUrl, retryNonce);

  useEffect(() => {
    setGarmentLoadStatus(slot, status);
    if (status === "error") {
      reportError(new Error("Failed to load garment model"), {
        slot,
        productId: item.productId,
        modelUrl: item.modelUrl,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, slot, item.productId, item.modelUrl]);

  if (!scene) return null;
  return <primitive object={scene} />;
}

export function AvatarScene() {
  const avatarType = useOutfitBuilderStore((s) => s.avatarType);
  const selections = useOutfitBuilderStore((s) => s.selections);
  const avatarRetryNonce = useOutfitBuilderStore((s) => s.avatarRetryNonce);
  const setAvatarLoadStatus = useOutfitBuilderStore((s) => s.setAvatarLoadStatus);

  const { scene: avatarScene, status: avatarStatus } = useGltfModel(
    AVATAR_MODEL_URLS[avatarType],
    avatarRetryNonce
  );

  useEffect(() => {
    setAvatarLoadStatus(avatarStatus);
    if (avatarStatus === "error") {
      reportError(new Error("Failed to load avatar model"), { avatarType });
    }
  }, [avatarStatus, avatarType, setAvatarLoadStatus]);

  if (!avatarScene) return null;

  return (
    <primitive object={avatarScene}>
      {(Object.entries(selections) as Array<[OutfitSlot, OutfitItem]>).map(([slot, item]) => (
        <GarmentAttachment key={slot} slot={slot} item={item} />
      ))}
    </primitive>
  );
}
