import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/account",
        "/account/",
        "/api/",
        "/checkout",
        "/sign-in",
        "/sign-up",
      ],
    },
    host: SITE_URL,
  };
}
