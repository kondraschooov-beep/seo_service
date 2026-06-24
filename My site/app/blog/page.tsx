import type { Metadata } from "next";
import SiteHeader from "@/components/sections/SiteHeader";
import Footer from "@/components/sections/Footer";
import PageCta from "@/components/sections/PageCta";
import Breadcrumbs from "@/components/sections/Breadcrumbs";
import RevealObserver from "@/components/ui/RevealObserver";
import { articles } from "@/lib/content";
import { breadcrumbSchema, JsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  title: "База знаний про SEO, GEO, AEO и AI-visibility",
  description: "Статьи о GEO, AEO, AI-visibility, ChatGPT, Perplexity, schema и Google AI Overviews.",
  alternates: { canonical: "/blog/" },
};

export default function BlogPage() {
  const crumbs = [
    { label: "Главная", href: "/" },
    { label: "База знаний", href: "/blog/" },
  ];

  return (
    <main>
      <SiteHeader />
      <section className="section page-hero">
        <div className="container">
          <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "База знаний" }]} />
          <p className="section-label">SEO · GEO · AI-search</p>
          <h1>База знаний про SEO, GEO, AEO и AI-visibility</h1>
          <p className="lead">
            Материалы под информационные интенты, которые помогают пользователям и AI-системам понять
            подход Павла Кондрашова к поисковой и генеративной видимости.
          </p>
        </div>
      </section>
      <section className="section page-list">
        <div className="container">
          <div className="grid-3 blog-grid">
            {articles.map((article) => (
              <a className="card related-card reveal" href={`/blog/${article.slug}/`} key={article.slug}>
                <span>База знаний</span>
                <h2>{article.title}</h2>
                <p>{article.metaDescription}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
      <PageCta label="Задать вопрос" />
      <Footer />
      <RevealObserver />
      <JsonLd data={breadcrumbSchema(crumbs)} />
    </main>
  );
}
