import type { Metadata } from "next";
import SiteHeader from "@/components/sections/SiteHeader";
import Footer from "@/components/sections/Footer";
import PageCta from "@/components/sections/PageCta";
import Breadcrumbs from "@/components/sections/Breadcrumbs";
import RevealObserver from "@/components/ui/RevealObserver";
import { cases, services, site } from "@/lib/content";
import { breadcrumbSchema, JsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Услуги SEO, GEO/AEO и AI-visibility — Павел Кондрашов",
  description:
    "Услуги Павла Кондрашова: SEO-продвижение, GEO/AEO оптимизация, AI-visibility аудит бренда и SEO+GEO аудит сайта.",
  alternates: { canonical: "/services/" },
};

const crumbs = [
  { label: "Главная", href: "/" },
  { label: "Услуги", href: "/services/" },
];

export default function ServicesPage() {
  return (
    <main>
      <SiteHeader />
      <section className="section page-hero">
        <div className="container">
          <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Услуги" }]} />
          <p className="section-label">SEO · GEO · AEO · AI-visibility</p>
          <h1>Услуги для видимости в поиске и ответах нейросетей</h1>
          <p className="lead">
            Четыре направления закрывают полный путь: технический и контентный фундамент SEO,
            оптимизацию под генеративный поиск, аудит AI-видимости бренда и быстрый разовый аудит сайта.
          </p>
        </div>
      </section>

      <section className="section page-list">
        <div className="container">
          <div className="grid-3">
            {services.map((service) => (
              <a className="card service-card reveal" href={`/services/${service.slug}/`} key={service.slug}>
                <p className="section-label">{service.keywords}</p>
                <h2>{service.title}</h2>
                <p className="desc">{service.desc}</p>
                <ul className="bullets">
                  {service.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <span className="card-more">Подробно →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section page-list">
        <div className="container">
          <p className="section-label">Кейсы</p>
          <h2>Доказательства опыта</h2>
          <div className="grid-3">
            {cases.map((item) => (
              <a className="card case reveal" href={`/cases/${item.slug}/`} key={item.slug}>
                <p className="niche">{item.niche}</p>
                <h3>{item.title}</h3>
                <p className="ctx">{item.context}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <PageCta label="Обсудить услугу" />
      <Footer />
      <RevealObserver />
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Услуги Павла Кондрашова",
          itemListElement: services.map((service, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${site.url}/services/${service.slug}/`,
            name: service.pageTitle,
          })),
        }}
      />
    </main>
  );
}
