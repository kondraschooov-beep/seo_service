import { cases } from "@/lib/content";

export default function Cases() {
  return (
    <section className="section" id="cases">
      <div className="container">
        <div className="reveal">
          <p className="section-label">Результаты</p>
          <h2>Кейсы</h2>
          <p className="lead">Несколько проектов, где видимость превратилась в трафик и заявки.</p>
        </div>

        <div className="grid-3">
          {cases.map((c) => {
            const [before, after] = c.delta.split("→");
            return (
              <a className="card case reveal" href={`/cases/${c.slug}/`} key={c.niche}>
                <p className="niche">{c.niche}</p>
                <p className="delta">
                  {before}
                  <span className="arrow">→</span>
                  {after}
                </p>
                <p className="unit">{c.deltaUnit}</p>
                <p className="ctx">{c.context}</p>
                <p className="term">{c.term}</p>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
