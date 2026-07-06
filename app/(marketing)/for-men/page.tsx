import type { Metadata } from "next";
import { AudienceLanding } from "@/components/marketing/audience-landing";
import { AUDIENCE_CONFIG } from "@/lib/audience-config";

const config = AUDIENCE_CONFIG.men;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: "/for-men" },
  openGraph: {
    title: config.metaTitle,
    description: config.metaDescription,
    url: "/for-men",
    images: [{ url: `/api/og?title=${encodeURIComponent(config.heading)}` }],
  },
};

export default function ForMenPage() {
  return <AudienceLanding config={config} />;
}
