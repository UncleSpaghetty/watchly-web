import type { MetadataRoute } from "next";

const baseUrl = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://watchly.unclespaghetty.com"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/about", "/login", "/privacy", "/terms"],
      disallow: [
        "/",
        "/my-series",
        "/news",
        "/search",
        "/series/",
        "/settings",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
