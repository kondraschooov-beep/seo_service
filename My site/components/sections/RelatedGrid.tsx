import { articles, cases, services } from "@/lib/content";

export default function RelatedGrid() {
  return (
    <section className="section related-section">
      <div className="container">
        <p className="section-label">Связанные материалы</p>
        <h2>Что посмотреть дальше</h2>
        <div className="grid-3 related-grid">
          {services.slice(0, 2).map((service) => (
            <a className="card related-card" href={`/services/${service.slug}/`} key={service.slug}>
              <span>Услуга</span>
              <h3>{service.title}</h3>
              <p>{service.desc}</p>
            </a>
          ))}
          {cases.slice(0, 1).map((item) => (
            <a className="card related-card" href={`/cases/${item.slug}/`} key={item.slug}>
              <span>Кейс</span>
              <h3>{item.title}</h3>
              <p>{item.context}</p>
            </a>
          ))}
          {articles.slice(0, 3).map((article) => (
            <a className="card related-card" href={`/blog/${article.slug}/`} key={article.slug}>
              <span>База знаний</span>
              <h3>{article.title}</h3>
              <p>{article.metaDescription}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
