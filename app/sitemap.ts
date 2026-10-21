import type { MetadataRoute } from "next";
import { programs } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const paths = ["", "/rankings", "/programs", "/courses", "/guide", "/visit", ...programs.map((program) => program.href)];
  return [...new Set(paths)].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly",
    priority: path === "" || path === "/rankings" ? 1 : 0.7,
  }));
}
