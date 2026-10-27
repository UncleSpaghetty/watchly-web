import type { MetadataRoute } from "next";

const baseUrl = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://watchly.unclespaghetty.com"
).replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/about", "/privacy", "/terms"].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date("2026-10-27"),
    changeFrequency: "yearly",
    priority: path === "/about" ? 0.8 : 0.5,
  }));
}
