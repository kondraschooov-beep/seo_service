import { about } from "@/lib/content";

export default function About() {
  return (
    <section className="section" id="about">
      <div className="container">
        <div className="about-grid">
          <div className="avatar reveal">
            {/* plain img keeps deploy simple (no next/image domain config needed) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={about.photo} alt={about.photoAlt} />
          </div>
          <div className="about-text reveal">
            <p className="section-label">Обо мне</p>
            {about.paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? "intro" : undefined}>
                {p}
              </p>
            ))}
            <div className="tools">
              {about.tools.map((tool) => (
                <span className="tool" key={tool}>
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
