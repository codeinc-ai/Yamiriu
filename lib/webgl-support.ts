/**
 * Best-effort WebGL + device-capability check (PRD 4.4 — the outfit builder
 * falls back to a 2D flat-lay mode on unsupported/low-capability devices).
 * Client-only — always call from an effect, never during SSR.
 */
export function detectWebglCapability(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  let gl: RenderingContext | null = null;
  try {
    const canvas = document.createElement("canvas");
    gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
  } catch {
    return false;
  }
  if (!gl) return false;

  // Low-capability heuristic: very memory-constrained devices struggle to
  // stream/parse glTF and decompress Draco meshes smoothly.
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof deviceMemory === "number" && deviceMemory > 0 && deviceMemory < 2) {
    return false;
  }

  return true;
}
