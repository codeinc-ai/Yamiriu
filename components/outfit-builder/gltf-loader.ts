"use client";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

let cachedLoader: GLTFLoader | null = null;

/**
 * Shared GLTFLoader wired for both compression schemes the 3D-asset spec
 * allows (3D-ASSET-SPEC.md) — Draco (decoder files at public/draco/, copied
 * from three/examples/jsm/libs/draco/gltf/) and Meshopt. Works identically
 * for uncompressed files; the decoders are only invoked if a file actually
 * uses the corresponding glTF extension.
 */
export function getGltfLoader(): GLTFLoader {
  if (cachedLoader) return cachedLoader;

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  loader.setMeshoptDecoder(MeshoptDecoder);

  cachedLoader = loader;
  return loader;
}
