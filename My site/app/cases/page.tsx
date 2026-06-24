import type { Metadata } from "next";
import SiteHeader from "@/components/sections/SiteHeader";
import Footer from "@/components/sections/Footer";
import PageCta from "@/components/sections/PageCta";
import Breadcrumbs from "@/components/sections/Breadcrumbs";
import RevealObserver from "@/components/ui/RevealObserver";
import { cases } from "@/lib/content";
import { breadcrumbSchema, JsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Кейсы SEO, GEO и AI-visibility — Павел Кондрашов",
  description: "Кейсы по SEO, GEO/AEO и AI-visibility: e-commerce, B2B SaaS и локальный бизнес.",
  alternates: { canonical: "/cases/" },
};

export default function CasesPage() {
  const crumbs = [
    { label: "Главная", href: "/" },
    { label: "Кейсы", href: "/cases/" },
  ];

  return (
    <main>
      <SiteHeader />
      <section className="section page-hero">
        <div className="container">
          <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Кейсы" }]} />
          <p className="section-label">Результаты</p>
          <h1>Кейсы SEO, GEO и AI-visibility</h1>
          <p className="lead">
            Обезличенные примеры проектов, где техническая оптимизация, структура, контент и работа
            с AI-ответами превратились в рост видимости и заявок.
          </p>
        </div>
      </section>
      <section className="section page-list">
        <div className="container">
          <div className="grid-3">
            {cases.map((item) => (
              <a className="card case reveal" href={`/cases/${item.slug}/`} key={item.slug}>
                <p className="niche">{item.niche}</p>
                <h2>{item.title}</h2>
                <p className="delta">{item.delta}</p>
                <p className="unit">{item.deltaUnit}</p>
                <p className="ctx">{item.context}</p>
                <p className="term">{item.term}</p>
              </a>
            ))}
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
