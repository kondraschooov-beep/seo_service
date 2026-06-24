import SiteHeader from "@/components/sections/SiteHeader";
import Footer from "@/components/sections/Footer";
import PageCta from "@/components/sections/PageCta";
import { services } from "@/lib/content";

export default function NotFound() {
  return (
    <main>
      <SiteHeader />
      <section className="section page-hero">
        <div className="container">
          <p className="section-label">404</p>
          <h1>Страница не найдена</h1>
          <p className="lead">Возможно, URL изменился или страница была удалена. Ниже — основные разделы сайта.</p>
          <div className="hero-cta">
            <a className="btn btn-primary" href="/services/seo-audit/">
              SEO и GEO аудит →
            </a>
            <a className="btn btn-ghost" href="/">
              На главную
            </a>
          </div>
        </div>
      </section>
      <section className="section page-list">
        <div className="container">
          <div className="grid-3">
            {services.map((service) => (
              <a className="card related-card" href={`/services/${service.slug}/`} key={service.slug}>
                <span>Услуга</span>
                <h2>{service.title}</h2>
                <p>{service.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
      <PageCta />
      <Footer />
    </main>
  );
}
