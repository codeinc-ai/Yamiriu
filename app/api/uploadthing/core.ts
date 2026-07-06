import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import { getCurrentUser } from "@/lib/auth-guards";
import { can } from "@/lib/rbac";
import { isAllowedImageBuffer, isAllowedGlbBuffer } from "@/lib/file-validation";
import { checkRateLimit } from "@/lib/rate-limit";

async function requireUploadQuota(userId: string) {
  const rl = await checkRateLimit("uploads", userId);
  if (!rl.success) throw new UploadThingError("Too many uploads — please slow down and try again shortly.");
}

const f = createUploadthing();
const utapi = new UTApi();

// S-014: the real business limit is 50MB, but uploadthing's route config only
// accepts power-of-2 literals ("32MB"/"64MB"), so the route is configured at
// the next tier up ("64MB") and the true 50MB ceiling is enforced manually
// below, on the actual downloaded byte length.
const MAX_MODEL_BYTES = 50 * 1024 * 1024;

export const ourFileRouter = {
  /** Saved-outfit thumbnails (WF-004) — captured client-side from the 3D
   * canvas or the 2D flat-lay composite, see lib/outfit-thumbnail.ts. */
  outfitThumbnail: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getCurrentUser();
      if (!user) throw new UploadThingError("Unauthorized");
      await requireUploadQuota(user.id);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl, userId: metadata.userId };
    }),

  /** Customer review photos (PRD 4.7, S-012) — the `image` route config
   * only checks the declared type; the actual bytes are verified via magic
   * number after upload, and a spoofed file is deleted immediately. */
  reviewPhoto: f({ image: { maxFileSize: "4MB", maxFileCount: 3 } })
    .middleware(async () => {
      const user = await getCurrentUser();
      if (!user) throw new UploadThingError("Unauthorized");
      await requireUploadQuota(user.id);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const response = await fetch(file.ufsUrl);
      const buffer = await response.arrayBuffer();
      if (!(await isAllowedImageBuffer(buffer))) {
        await utapi.deleteFiles(file.key);
        throw new UploadThingError("File content doesn't match an accepted image type.");
      }
      return { url: file.ufsUrl, userId: metadata.userId };
    }),

  /** Admin product gallery photos (PRD 4.8.3, S-012). */
  productImage: f({ image: { maxFileSize: "4MB", maxFileCount: 6 } })
    .middleware(async () => {
      const user = await getCurrentUser();
      if (!user || !can(user, "products:write")) throw new UploadThingError("Unauthorized");
      await requireUploadQuota(user.id);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const response = await fetch(file.ufsUrl);
      const buffer = await response.arrayBuffer();
      if (!(await isAllowedImageBuffer(buffer))) {
        await utapi.deleteFiles(file.key);
        throw new UploadThingError("File content doesn't match an accepted image type.");
      }
      return { url: file.ufsUrl, userId: metadata.userId };
    }),

  /** Admin content images (PRD 4.8.8) — banners, lookbook editorial shots,
   * journal cover images. Gated on content:write rather than products:write
   * so a future content-only role isn't coupled to product permissions. */
  contentImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getCurrentUser();
      if (!user || !can(user, "content:write")) throw new UploadThingError("Unauthorized");
      await requireUploadQuota(user.id);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const response = await fetch(file.ufsUrl);
      const buffer = await response.arrayBuffer();
      if (!(await isAllowedImageBuffer(buffer))) {
        await utapi.deleteFiles(file.key);
        throw new UploadThingError("File content doesn't match an accepted image type.");
      }
      return { url: file.ufsUrl, userId: metadata.userId };
    }),

  /** Admin 3D garment model upload (PRD 4.8.4, S-012/S-014) — hasModel/modelUrl
   * are only set on the product once this succeeds. */
  productModel: f({ blob: { maxFileSize: "64MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getCurrentUser();
      if (!user || !can(user, "products:write")) throw new UploadThingError("Unauthorized");
      await requireUploadQuota(user.id);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const response = await fetch(file.ufsUrl);
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > MAX_MODEL_BYTES) {
        await utapi.deleteFiles(file.key);
        throw new UploadThingError("Model file exceeds the 50MB limit.");
      }
      if (!(await isAllowedGlbBuffer(buffer))) {
        await utapi.deleteFiles(file.key);
        throw new UploadThingError("File content doesn't match a valid .glb model.");
      }
      return { url: file.ufsUrl, userId: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
