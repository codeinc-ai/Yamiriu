"use client";

import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { AvatarScene } from "./avatar-scene";
import { useOutfitBuilderStore } from "@/stores/outfit-builder";

const BRAND_CREAM = "#f7f3ec";

/** Registers a thumbnail-capture function (lib/outfit-thumbnail.ts) while the
 * live canvas is mounted — `preserveDrawingBuffer` below is required for
 * `toDataURL` to read back a frame the browser would otherwise discard. */
function CanvasCaptureRegistrar() {
  const { gl } = useThree();
  const setCanvasCaptureFn = useOutfitBuilderStore((s) => s.setCanvasCaptureFn);

  useEffect(() => {
    setCanvasCaptureFn(() => gl.domElement.toDataURL("image/png"));
    return () => setCanvasCaptureFn(null);
  }, [gl, setCanvasCaptureFn]);

  return null;
}

/**
 * Everything in this file (plus three/@react-three/fiber/drei themselves)
 * only ever loads behind the `next/dynamic(..., { ssr: false })` boundary in
 * outfit-builder-viewport.tsx — never imported from anywhere else, so it
 * never touches another page's bundle or LCP (PRD Rule 17, BLOCK 07).
 */
export default function Viewport3D() {
  return (
    <Canvas
      shadows="basic"
      dpr={[1, 2]}
      camera={{ position: [0, 1.3, 3], fov: 32 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
    >
      <color attach="background" args={[BRAND_CREAM]} />
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[3, 5, 2]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} />
      <CanvasCaptureRegistrar />
      <Suspense fallback={null}>
        <AvatarScene />
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
