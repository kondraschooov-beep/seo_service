import type { MetadataRoute } from "next";
import { articles, cases, services, site } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const urls = [
    "/",
    "/services/",
    ...services.map((service) => `/services/${service.slug}/`),
    "/cases/",
    ...cases.map((item) => `/cases/${item.slug}/`),
    "/about/",
    "/blog/",
    ...articles.map((article) => `/blog/${article.slug}/`),
  ];

  return urls.map((url) => ({
    url: new URL(url, site.url).toString(),
    lastModified: now,
  }));
}
