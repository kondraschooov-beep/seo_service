import { services } from "@/lib/content";
import type { Service } from "@/lib/content";

function Icon({ kind }: { kind: Service["icon"] }) {
  if (kind === "search") {
    return (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={2}>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    );
  }
  if (kind === "geo") {
    return (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={2}>
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2}>
      <path d="M12 2a7 7 0 0 1 7 7c0 2-1 3.5-2.5 5l-.5 3h-8l-.5-3C5 12.5 4 11 4 9a7 7 0 0 1 7-7Z" />
      <path d="M9 21h6" />
    </svg>
  );
}

export default function Services() {
  return (
    <section className="section" id="services">
      <div className="container">
        <div className="reveal">
          <p className="section-label">Что я делаю</p>
          <h2>Три слоя видимости</h2>
          <p className="lead">
            Классический поиск никуда не делся — но рядом вырос генеративный. Я работаю на обоих
            фронтах сразу.
          </p>
        </div>

        <div className="grid-3">
          {services.map((s) => (
            <a className="card service-card reveal" href={`/services/${s.slug}/`} key={s.title}>
              <div className="svc-icon">
                <Icon kind={s.icon} />
              </div>
              <h3>{s.title}</h3>
              <p className="desc">{s.desc}</p>
              <ul className="bullets">
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <span className="card-more">Подробно →</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
