import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/brand";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/configure", "/the-home", "/process", "/faq", "/enquire"].map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: "monthly",
    priority: p === "" ? 1 : 0.7,
  }));
}
