"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { useGltfModel } from "@/components/outfit-builder/use-gltf-model";
import { AVATAR_MODEL_URLS } from "@/lib/outfit-builder-config";
import type { ShopCategory } from "@/lib/categories";

const BRAND_CREAM = "#f7f3ec";

function Garment({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGltfModel(modelUrl);
  if (!scene) return null;
  return <primitive object={scene} />;
}

function AvatarWithGarment({ category, modelUrl }: { category: ShopCategory; modelUrl: string }) {
  const { scene: avatarScene } = useGltfModel(AVATAR_MODEL_URLS[category]);
  if (!avatarScene) return null;
  return (
    <primitive object={avatarScene}>
      <Garment modelUrl={modelUrl} />
    </primitive>
  );
}

/**
 * Single-garment preview for the admin form (PRD 4.8.4/4.8.6) — staff verify
 * a model on its avatar before publishing. Deliberately simpler than the
 * outfit-builder's multi-slot viewport: one avatar, one garment, no store.
 * Same dynamic-import boundary rule applies — never imported outside
 * model-preview-viewport.tsx's next/dynamic(..., { ssr: false }).
 */
export default function ModelPreviewCanvas({
  category,
  modelUrl,
}: {
  category: ShopCategory;
  modelUrl: string;
}) {
  return (
    <Canvas
      shadows="basic"
      dpr={[1, 2]}
      camera={{ position: [0, 1.3, 3], fov: 32 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={[BRAND_CREAM]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 2]} intensity={1.2} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} />
      <Suspense fallback={null}>
        <AvatarWithGarment category={category} modelUrl={modelUrl} />
      </Suspense>
      <ContactShadows position={[0, 0, 0]} opacity={0.3} scale={4} blur={2.2} far={2} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={1.2}
        maxDistance={5}
        maxPolarAngle={Math.PI * 0.85}
        target={[0, 1, 0]}
      />
    </Canvas>
  );
}
