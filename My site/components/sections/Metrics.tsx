import { metrics } from "@/lib/content";

export default function Metrics() {
  return (
    <section className="section" style={{ padding: "50px 0" }}>
      <div className="container">
        <div className="card metrics reveal" style={{ padding: 18 }}>
          {metrics.map((m) => (
            <div className="metric" key={m.label}>
              <div className="num">{m.num}</div>
              <div className="lbl">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
