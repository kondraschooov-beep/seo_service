import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/sections/SiteHeader";
import Footer from "@/components/sections/Footer";
import PageCta from "@/components/sections/PageCta";
import Breadcrumbs from "@/components/sections/Breadcrumbs";
import RelatedGrid from "@/components/sections/RelatedGrid";
import RevealObserver from "@/components/ui/RevealObserver";
import { articles, site } from "@/lib/content";
import { absolute, breadcrumbSchema, JsonLd } from "@/lib/schema";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) return {};

  return {
    title: `${article.title} — Павел Кондрашов`,
    description: article.metaDescription,
    alternates: { canonical: `/blog/${article.slug}/` },
    openGraph: {
      title: article.title,
      description: article.metaDescription,
      url: `${site.url}/blog/${article.slug}/`,
      type: "article",
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();

  const crumbs = [
    { label: "Главная", href: "/" },
    { label: "База знаний", href: "/blog/" },
    { label: article.title, href: `/blog/${article.slug}/` },
  ];

  return (
    <main>
      <SiteHeader />
      <article>
        <section className="section page-hero">
          <div className="container">
            <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "База знаний", href: "/blog/" }, { label: article.title }]} />
            <p className="section-label">База знаний</p>
            <h1>{article.title}</h1>
            <p className="lead">{article.metaDescription}</p>
          </div>
        </section>
        <section className="section detail-section">
          <div className="container">
            <div className="content-stack">
              <div className="card prose-card article-card reveal">
                <p className="article-intro">{article.intro}</p>
              </div>

              {article.sections.map((section) => (
                <section className="card prose-card article-card reveal" key={section.title}>
                  <h2>{section.title}</h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets ? (
                    <ul className="bullets">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}

              {article.takeaways ? (
                <section className="card prose-card article-card article-takeaways reveal">
                  <h2>Коротко</h2>
                  <ul className="bullets">
                    {article.takeaways.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {article.sourceLinks ? (
                <div className="card prose-card article-card reveal">
                  <div className="article-sources">
                    <h2>Источники и контекст</h2>
                    <div className="source-list">
                      {article.sourceLinks.map((source) => (
                        <a className="source-item source-link-card" href={source.url} target="_blank" rel="noreferrer" key={source.url}>
                          <span className="source-title">{source.source ? `${source.source}: ` : ""}{source.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </article>
      <RelatedGrid />
      <PageCta label="Обсудить GEO" />
      <Footer />
      <RevealObserver />
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.metaDescription,
          author: { "@type": "Person", name: "Pavel Kondrashov", url: site.url },
          mainEntityOfPage: absolute(`/blog/${article.slug}/`),
        }}
      />
    </main>
  );
}
