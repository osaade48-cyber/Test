import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/render", "/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
