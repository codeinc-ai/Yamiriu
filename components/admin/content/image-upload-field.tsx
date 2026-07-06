"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { uploadFiles } from "@/lib/uploadthing";

/** Single-image upload + preview, shared by the banner/lookbook/journal
 * forms (PRD 4.8.8) — all use the same UploadThing `contentImage` route. */
export function ImageUploadField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  error?: string;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const [uploaded] = await uploadFiles("contentImage", { files: [file] });
      onChange(uploaded.ufsUrl);
    } catch {
      toast.error("Couldn't upload the image. Please try again.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-ink">{label}</label>
      {value ? (
        <div className="relative h-32 w-full overflow-hidden rounded-lg border border-ink/10 bg-cream sm:w-56">
          <Image src={value} alt={`${label} preview`} fill unoptimized sizes="224px" className="object-cover" />
        </div>
      ) : null}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleChange}
        disabled={uploading}
        className="block w-full text-sm text-ink/70 file:mr-3 file:rounded-md file:border-0 file:bg-ink/5 file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
