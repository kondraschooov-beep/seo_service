import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/sections/SiteHeader";
import Footer from "@/components/sections/Footer";
import PageCta from "@/components/sections/PageCta";
import Breadcrumbs from "@/components/sections/Breadcrumbs";
import RelatedGrid from "@/components/sections/RelatedGrid";
import RevealObserver from "@/components/ui/RevealObserver";
import { services, site } from "@/lib/content";
import { absolute, breadcrumbSchema, JsonLd } from "@/lib/schema";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((item) => item.slug === slug);
  if (!service) return {};

  return {
    title: service.metaTitle,
    description: service.metaDescription,
    keywords: service.keywords,
    alternates: { canonical: `/services/${service.slug}/` },
    openGraph: {
      title: service.metaTitle,
      description: service.metaDescription,
      url: `${site.url}/services/${service.slug}/`,
      type: "website",
    },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = services.find((item) => item.slug === slug);
  if (!service) notFound();

  const crumbs = [
    { label: "Главная", href: "/" },
    { label: "Услуги", href: "/services/" },
    { label: service.title, href: `/services/${service.slug}/` },
  ];

  return (
    <main>
      <SiteHeader />
      <article>
        <section className="section page-hero">
          <div className="container">
            <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Услуги", href: "/services/" }, { label: service.title }]} />
            <p className="section-label">{service.keywords}</p>
            <h1>{service.pageTitle}</h1>
            <p className="lead">{service.desc}</p>
            <div className="hero-cta">
              <a className="btn btn-primary" href={site.telegram.url} target="_blank" rel="noopener noreferrer">
                Написать в Telegram →
              </a>
              <a className="btn btn-ghost" href="/cases/">
                Посмотреть кейсы
              </a>
            </div>
          </div>
        </section>

        <section className="section detail-section">
          <div className="container">
            <div className="fact-grid">
              {service.facts.map((fact) => (
                <div className="card fact-card reveal" key={fact.label}>
                  <p className="section-label">{fact.label}</p>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>

            <div className="content-stack">
              {service.sections.map((section) => (
                <section className="card prose-card reveal" key={section.title}>
                  <h2>{section.title}</h2>
                  <p>{section.body}</p>
                  {section.bullets ? (
                    <ul className="bullets">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}

              <section className="card prose-card reveal">
                <h2>FAQ</h2>
                <div className="faq-static">
                  {service.faq.map((item) => (
                    <details key={item.q}>
                      <summary>{item.q}</summary>
                      <p>{item.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </section>
      </article>
      <RelatedGrid />
      <PageCta label={service.slug === "seo-audit" ? "Заказать аудит" : "Обсудить проект"} />
      <Footer />
      <RevealObserver />
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: service.pageTitle,
          description: service.metaDescription,
          url: absolute(`/services/${service.slug}/`),
          provider: { "@type": "Person", name: "Pavel Kondrashov", url: site.url },
          serviceType: service.title,
          areaServed: "RU",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: service.faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />
    </main>
  );
}
