"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProjectDTO } from "@/lib/types";
import { Kicker, ProjectLogo } from "@/components/ui";

export function ProjectsView({ initial }: { initial: ProjectDTO[] }) {
  const [projects, setProjects] = useState(initial);
  const [creating, setCreating] = useState(initial.length === 0);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [brand, setBrand] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, domain, brandKeywords: brand }),
    });
    setBusy(false);
    if (res.ok) {
      const { project } = await res.json();
      setProjects([project, ...projects]);
      setName("");
      setDomain("");
      setBrand("");
      setCreating(false);
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Не удалось создать проект");
    }
  }

  const inputCls = "w-full border border-line bg-white px-3 py-2.5 text-sm placeholder:text-mute";

  const connections = (p: ProjectDTO) =>
    [
      Boolean(p.metrikaCounterId && p.metrikaToken) && "Метрика",
      Boolean(p.gscSiteUrl && p.gscCredentials) && "GSC",
      Boolean(p.wmToken) && "Вебмастер",
    ].filter(Boolean) as string[];

  return (
    <main className="mx-auto max-w-6xl px-6 pb-24">
      <div className="flex items-end justify-between border-b border-ink/80 pt-12 pb-4">
        <div>
          <Kicker>Личный кабинет</Kicker>
          <h1 className="font-display mt-1 text-4xl font-medium">Проекты</h1>
        </div>
        <button
          onClick={() => setCreating(!creating)}
          className="cursor-pointer bg-night px-4 py-2 text-sm font-medium text-paper hover:bg-night-2"
        >
          {creating ? "Скрыть" : "+ Новый проект"}
        </button>
      </div>

      {creating && (
        <form onSubmit={create} className="mt-6 border border-line bg-card p-6">
          <Kicker className="mb-4">Новый проект</Kicker>
          <div className="grid gap-3 sm:grid-cols-3">
            <input className={inputCls} required placeholder="Название — например, Histhut" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={inputCls} placeholder="Домен — histhut.ru" value={domain} onChange={(e) => setDomain(e.target.value)} />
            <input className={inputCls} placeholder="Брендовые слова через запятую" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          {error && <div className="mt-3 text-sm text-rust">{error}</div>}
          <div className="mt-4 flex items-center gap-4">
            <button disabled={busy} className="cursor-pointer bg-pine px-4 py-2 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50">
              Создать
            </button>
            <span className="text-xs text-mute">
              Токены Метрики, GSC и Вебмастера подключите потом в настройках проекта. До подключения дашборд работает на демо-данных.
            </span>
          </div>
        </form>
      )}

      {projects.length === 0 && !creating && (
        <p className="mt-10 text-ink-2">Пока нет ни одного проекта — создайте первый.</p>
      )}

      <div className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const conns = connections(p);
          return (
            <Link
              key={p.id}
              href={`/p/${p.id}`}
              className="group flex flex-col justify-between gap-6 bg-card p-6 transition-colors hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <ProjectLogo logo={p.logo} name={p.name} size={48} />
                <span className="font-display text-2xl text-mute transition-transform group-hover:translate-x-1 group-hover:text-pine">
                  →
                </span>
              </div>
              <div>
                <div className="font-display text-2xl font-medium leading-snug">{p.name}</div>
                <div className="mt-1 text-sm text-ink-2">{p.domain || "домен не указан"}</div>
                <div className="mt-3 text-[11px] uppercase tracking-[0.14em] text-mute">
                  {conns.length ? `Подключено: ${conns.join(" · ")}` : "Демо-данные"}
                </div>
              </div>
            </Link>
          );
        })}
        {/* добивка сетки пустыми ячейками, чтобы линии были ровными */}
        {projects.length % 3 !== 0 &&
          Array.from({ length: 3 - (projects.length % 3) }).map((_, i) => (
            <div key={`pad-${i}`} className="hidden bg-paper lg:block" />
          ))}
      </div>
    </main>
  );
}
