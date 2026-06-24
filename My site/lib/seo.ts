import type { Metadata } from "next";
import { mediaMentions, publicAppearances, publicSources, site } from "./content";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: "Pavel Kondrashov — SEO, GEO и AI-visibility",
  description:
    "Pavel Kondrashov — специалист по SEO, GEO (Generative Engine Optimization) и AI-visibility. Продвижение, которое работает в эпоху ChatGPT, Perplexity и Google AI Overviews.",
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: site.url,
    title: "Pavel Kondrashov — SEO, GEO и AI-visibility",
    description:
      "Чтобы тебя находили и люди, и нейросети. SEO, GEO/AEO и попадание бренда в ответы ChatGPT, Claude и Gemini.",
    siteName: "Pavel Kondrashov",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pavel Kondrashov — SEO, GEO и AI-visibility",
    description: "Продвижение, которое работает в эпоху генеративного поиска.",
  },
};

export const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      name: "Pavel Kondrashov",
      jobTitle: "Специалист по SEO, GEO и AI-visibility",
      url: site.url,
      sameAs: publicSources.map((source) => source.url),
      worksFor: {
        "@type": "Organization",
        name: "i-Media",
        url: "https://www.i-media.ru/",
      },
      knowsAbout: [
        "SEO",
        "Generative Engine Optimization",
        "Answer Engine Optimization",
        "AI visibility",
        "Technical SEO",
        "Content strategy",
      ],
      subjectOf: [...mediaMentions, ...publicAppearances].map((item) => ({
        "@type": "CreativeWork",
        name: item.title,
        url: item.url,
        publisher: item.source ? { "@type": "Organization", name: item.source } : undefined,
      })),
    },
    {
      "@type": "ProfessionalService",
      name: "Pavel Kondrashov — SEO / GEO / AI-visibility",
      description:
        "Продвижение в классическом и генеративном поиске: SEO, GEO/AEO и попадание бренда в ответы LLM.",
      url: site.url,
      areaServed: "Worldwide",
      priceRange: "$$",
      email: site.email,
    },
  ],
};
