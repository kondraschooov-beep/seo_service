"use client";

import { useState } from "react";
import { faq } from "@/lib/content";

export default function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="section" id="faq">
      <div className="container">
        <div className="reveal">
          <p className="section-label">Вопросы</p>
          <h2>FAQ</h2>
        </div>
        <div className="faq-list reveal">
          {faq.map((item, i) => {
            const isOpen = open === i;
            return (
              <div className={`faq-item${isOpen ? " open" : ""}`} key={item.q}>
                <button
                  className="faq-q"
                  aria-expanded={isOpen}
                  aria-controls={`faq-a-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span>{item.q}</span>
                  <span className="ico" aria-hidden="true">
                    +
                  </span>
                </button>
                <div
                  className="faq-a"
                  id={`faq-a-${i}`}
                  role="region"
                  style={{ maxHeight: isOpen ? 600 : 0 }}
                >
                  <div className="faq-a-inner">{item.a}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
