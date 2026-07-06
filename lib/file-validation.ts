import "server-only";
import { fileTypeFromBuffer } from "file-type";

const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Validates actual file content via magic bytes (S-012) — never trust a
 * declared extension or Content-Type header, since either can be spoofed by
 * renaming an arbitrary file.
 */
export async function isAllowedImageBuffer(buffer: ArrayBuffer): Promise<boolean> {
  const detected = await fileTypeFromBuffer(new Uint8Array(buffer));
  return Boolean(detected && ALLOWED_IMAGE_MIME_TYPES.has(detected.mime));
}

// glTF binary (.glb) magic number: ASCII "glTF" (0x67 0x6C 0x54 0x46) as the
// first 4 bytes of the 12-byte header, followed by a uint32 version and
// uint32 total length — checked directly (file-type has no glb signature)
// rather than trusting the declared extension/Content-Type (S-012).
const GLB_MAGIC = 0x46546c67; // "glTF" little-endian

export async function isAllowedGlbBuffer(buffer: ArrayBuffer): Promise<boolean> {
  if (buffer.byteLength < 12) return false;
  const view = new DataView(buffer);
  return view.getUint32(0, true) === GLB_MAGIC;
}
