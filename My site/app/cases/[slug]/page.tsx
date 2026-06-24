import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/sections/SiteHeader";
import Footer from "@/components/sections/Footer";
import PageCta from "@/components/sections/PageCta";
import Breadcrumbs from "@/components/sections/Breadcrumbs";
import RelatedGrid from "@/components/sections/RelatedGrid";
import RevealObserver from "@/components/ui/RevealObserver";
import { cases, services, site } from "@/lib/content";
import { absolute, breadcrumbSchema, JsonLd } from "@/lib/schema";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return cases.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = cases.find((entry) => entry.slug === slug);
  if (!item) return {};

  return {
    title: `${item.title} — кейс Павла Кондрашова`,
    description: item.metaDescription,
    alternates: { canonical: `/cases/${item.slug}/` },
    openGraph: {
      title: item.title,
      description: item.metaDescription,
      url: `${site.url}/cases/${item.slug}/`,
      type: "article",
    },
  };
}

export default async function CasePage({ params }: Props) {
  const { slug } = await params;
  const item = cases.find((entry) => entry.slug === slug);
  if (!item) notFound();

  const crumbs = [
    { label: "Главная", href: "/" },
    { label: "Кейсы", href: "/cases/" },
    { label: item.niche, href: `/cases/${item.slug}/` },
  ];

  return (
    <main>
      <SiteHeader />
      <article>
        <section className="section page-hero">
          <div className="container">
            <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Кейсы", href: "/cases/" }, { label: item.niche }]} />
            <p className="section-label">{item.niche}</p>
            <h1>{item.title}</h1>
            <p className="lead">{item.metaDescription}</p>
          </div>
        </section>

        <section className="section detail-section">
          <div className="container">
            <div className="fact-grid">
              <div className="card fact-card reveal">
                <p className="section-label">Результат</p>
                <strong>{item.delta} {item.deltaUnit}</strong>
              </div>
              <div className="card fact-card reveal">
                <p className="section-label">Срок</p>
                <strong>{item.term.replace("Срок: ", "")}</strong>
              </div>
              <div className="card fact-card reveal">
                <p className="section-label">Формат</p>
                <strong>{item.source ? "Публичный кейс" : "Обезличенный кейс под NDA"}</strong>
              </div>
            </div>

            <div className="content-stack">
              <section className="card prose-card reveal">
                <h2>Стартовая ситуация</h2>
                <p>{item.problem}</p>
              </section>
              <section className="card prose-card reveal">
                <h2>Что сделали</h2>
                <ul className="bullets">
                  {item.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </section>
              <section className="card prose-card reveal">
                <h2>Ограничения</h2>
                <p>{item.limits}</p>
              </section>
              {item.source ? (
                <section className="card prose-card reveal">
                  <h2>Внешнее подтверждение</h2>
                  <p>
                    Кейс опубликован во внешнем источнике. На этой странице он пересказан кратко и
                    адаптирован под структуру сайта.
                  </p>
                  <a className="source-title" href={item.source.url} target="_blank" rel="noreferrer">
                    {item.source.source ? `${item.source.source}: ` : ""}
                    {item.source.title}
                  </a>
                </section>
              ) : null}
              <section className="card prose-card reveal">
                <h2>Связанные услуги</h2>
                <div className="mini-links">
                  {services.map((service) => (
                    <a href={`/services/${service.slug}/`} key={service.slug}>
                      {service.title}
                    </a>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </section>
      </article>
      <RelatedGrid />
      <PageCta />
      <Footer />
      <RevealObserver />
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: item.title,
          description: item.metaDescription,
          author: { "@type": "Person", name: "Pavel Kondrashov", url: site.url },
          mainEntityOfPage: absolute(`/cases/${item.slug}/`),
        }}
      />
    </main>
  );
}
