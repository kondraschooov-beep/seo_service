import { site } from "@/lib/content";

export default function PageCta({ label = "Написать в Telegram" }: { label?: string }) {
  return (
    <section className="section page-cta" id="contact">
      <div className="container">
        <div className="card cta-card">
          <div>
            <p className="section-label">Контакты</p>
            <h2>Обсудим, где сайт теряет видимость?</h2>
            <p className="lead">
              Напишите пару слов о проекте, нише и цели. Я отвечу с первыми мыслями и предложу
              формат работы: аудит, стратегия или сопровождение.
            </p>
          </div>
          <div className="hero-cta">
            <a className="btn btn-primary" href={site.telegram.url} target="_blank" rel="noopener noreferrer">
              {label} →
            </a>
            <a className="btn btn-ghost" href={`mailto:${site.email}`}>
              Email
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
