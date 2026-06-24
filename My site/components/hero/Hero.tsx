import RobotCanvas from "./RobotCanvas";
import { nav, hero } from "@/lib/content";

export default function Hero() {
  return (
    <header className="hero">
      <div className="container">
        <nav className="nav">
          <div className="logo">
            Pavel<span>.</span>Kondrashov
          </div>
          <div className="nav-links">
            {nav.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      </div>

      <div className="container hero-inner">
        <div className="hero-copy">
          <span className="hero-pill">
            <span className="dot" />
            {hero.pill}
          </span>
          <h1>
            {hero.title} <span className="grad-text">{hero.titleAccent}</span>
          </h1>
          <p className="sub">{hero.subtitle}</p>
          <div className="hero-cta">
            <a href="#contact" className="btn btn-primary">
              {hero.ctaPrimary} →
            </a>
            <a href="#cases" className="btn btn-ghost">
              {hero.ctaSecondary}
            </a>
          </div>
        </div>

        <RobotCanvas />
      </div>

      <div className="scroll-ind">
        <div className="mouse" />
        <span>scroll</span>
      </div>
    </header>
  );
}
