import { nav } from "@/lib/content";

export default function SiteHeader() {
  return (
    <header className="page-top">
      <div className="container">
        <nav className="nav">
          <a className="logo" href="/">
            Pavel<span>.</span>Kondrashov
          </a>
          <div className="nav-links">
            {nav.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
