import { process } from "@/lib/content";

export default function Process() {
  return (
    <section className="section" id="process">
      <div className="container">
        <div className="reveal">
          <p className="section-label">Как это устроено</p>
          <h2>Процесс работы</h2>
        </div>
        <div className="steps">
          {process.map((step) => (
            <div className="card step reveal" key={step.n}>
              <div className="n">{step.n}</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
