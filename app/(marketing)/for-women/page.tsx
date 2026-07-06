import type { Metadata } from "next";
import { AudienceLanding } from "@/components/marketing/audience-landing";
import { AUDIENCE_CONFIG } from "@/lib/audience-config";

const config = AUDIENCE_CONFIG.women;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: "/for-women" },
  openGraph: {
    title: config.metaTitle,
    description: config.metaDescription,
    url: "/for-women",
    images: [{ url: `/api/og?title=${encodeURIComponent(config.heading)}` }],
  },
};

export default function ForWomenPage() {
  return <AudienceLanding config={config} />;
}
