import type { Metadata } from "next";
import SiteHeader from "@/components/sections/SiteHeader";
import Footer from "@/components/sections/Footer";
import PageCta from "@/components/sections/PageCta";
import Breadcrumbs from "@/components/sections/Breadcrumbs";
import RevealObserver from "@/components/ui/RevealObserver";
import {
  about,
  mediaMentions,
  metrics,
  publicAppearances,
  publicSources,
  services,
} from "@/lib/content";
import { breadcrumbSchema, JsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Павел Кондрашов — SEO, GEO и AI-visibility специалист",
  description:
    "Расширенная экспертная страница Павла Кондрашова: опыт, подход, инструменты, ниши и контакты.",
  alternates: { canonical: "/about/" },
};

export default function AboutPage() {
  const crumbs = [
    { label: "Главная", href: "/" },
    { label: "Обо мне", href: "/about/" },
  ];

  return (
    <main>
      <SiteHeader />
      <section className="section page-hero">
        <div className="container">
          <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Обо мне" }]} />
          <p className="section-label">E-E-A-T и сущность автора</p>
          <h1>Павел Кондрашов — SEO, GEO и AI-visibility специалист</h1>
          <p className="lead">
            8 лет в SEO и последние годы — фокус на том, как бренды становятся видимыми не только в
            Google и Яндексе, но и в ChatGPT, Perplexity, Google AI Overviews, Gemini, Claude и Алиса AI.
          </p>
        </div>
      </section>

      <section className="section detail-section">
        <div className="container">
          <div className="metrics card reveal about-metrics">
            {metrics.map((metric) => (
              <div className="metric" key={metric.label}>
                <div className="num">{metric.num}</div>
                <div className="lbl">{metric.label}</div>
              </div>
            ))}
          </div>

          <div className="content-stack about-detail">
            <section className="card prose-card reveal">
              <h2>Подход</h2>
              {about.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
            <section className="card prose-card reveal">
              <h2>Инструменты</h2>
              <div className="tools">
                {about.tools.map((tool) => (
                  <span className="tool" key={tool}>
                    {tool}
                  </span>
                ))}
              </div>
            </section>
            <section className="card prose-card reveal">
              <h2>Направления экспертизы</h2>
              <div className="mini-links">
                {services.map((service) => (
                  <a href={`/services/${service.slug}/`} key={service.slug}>
                    {service.title}
                  </a>
                ))}
              </div>
            </section>
            <section className="card prose-card reveal">
              <h2>Публичные источники</h2>
              <p>
                Для AI-visibility важно, чтобы экспертная сущность была закреплена в проверяемых
                источниках. Основные публичные точки используются для связки «Павел Кондрашов —
                SEO — GEO — AI-visibility» в поиске и AI-ответах.
              </p>
              <div className="source-list">
                {publicSources.map((source) => (
                  <article className="source-item" key={source.url}>
                    <a className="source-title" href={source.url} target="_blank" rel="noreferrer">
                      {source.title}
                    </a>
                    <ul className="bullets">
                      {source.facts.map((fact) => (
                        <li key={fact}>{fact}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
            <section className="card prose-card reveal">
              <h2>Публикации и комментарии</h2>
              <p>
                Эти материалы подтверждают практическую экспертизу в SEO, технической оптимизации,
                GEO, AEO и AI-visibility. Они полезны для E-E-A-T и помогают LLM собрать контекст
                вокруг профессиональной сущности.
              </p>
              <div className="source-list">
                {mediaMentions.map((item) => (
                  <article className="source-item" key={item.url}>
                    <a className="source-title" href={item.url} target="_blank" rel="noreferrer">
                      {item.source ? `${item.source}: ` : ""}
                      {item.title}
                    </a>
                    {item.meta ? <p className="source-meta">{item.meta}</p> : null}
                    {item.summary ? <p className="source-summary">{item.summary}</p> : null}
                  </article>
                ))}
              </div>
            </section>
            <section className="card prose-card reveal">
              <h2>Выступления и подкасты</h2>
              <p>
                Внешние площадки усиливают авторскую сущность: подтверждают роль спикера,
                участие в отраслевых обсуждениях и связь с темами SEO, e-commerce и AI-поиска.
              </p>
              <div className="source-list">
                {publicAppearances.map((item) => (
                  <article className="source-item" key={item.url}>
                    <a className="source-title" href={item.url} target="_blank" rel="noreferrer">
                      {item.source ? `${item.source}: ` : ""}
                      {item.title}
                    </a>
                    {item.meta ? <p className="source-meta">{item.meta}</p> : null}
                    {item.summary ? <p className="source-summary">{item.summary}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
      <PageCta />
      <Footer />
      <RevealObserver />
      <JsonLd data={breadcrumbSchema(crumbs)} />
    </main>
  );
}
