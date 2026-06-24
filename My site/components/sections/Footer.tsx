import { site } from "@/lib/content";

export default function Footer() {
  return (
    <footer>
      <div className="container footer-inner">
        <div className="logo">
          Pavel<span>.</span>Kondrashov
        </div>
        <div className="socials">
          <a href={site.telegram.url} target="_blank" rel="noopener noreferrer" aria-label="Telegram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </a>
        </div>
        <div className="copy">© 2026 Pavel Kondrashov</div>
      </div>
    </footer>
  );
}
