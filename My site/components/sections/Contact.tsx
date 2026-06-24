import { contact, site } from "@/lib/content";

export default function Contact() {
  return (
    <section className="section contact" id="contact">
      <div className="container">
        <div
          className="reveal"
          style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 40px" }}
        >
          <p className="section-label" style={{ color: "var(--accent-2)" }}>
            {contact.label}
          </p>
          <h2>{contact.title}</h2>
          <p className="lead" style={{ margin: "14px auto 0" }}>
            {contact.lead}
          </p>
        </div>

        <div className="alt-contact reveal" style={{ maxWidth: 520, margin: "0 auto" }}>
          <a className="alt-link" href={site.telegram.url} target="_blank" rel="noopener noreferrer">
            <span className="ico">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth={2}>
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </span>
            <span>
              Telegram
              <small>{site.telegram.handle} — быстрее всего</small>
            </span>
          </a>
          <a className="alt-link" href={`mailto:${site.email}`}>
            <span className="ico">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth={2}>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m2 6 10 7 10-7" />
              </svg>
            </span>
            <span>
              Email
              <small>{site.email}</small>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
