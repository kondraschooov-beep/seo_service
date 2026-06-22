"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DashboardData, ProjectDTO } from "@/lib/types";
import { fmtDate, fmtInt, fmtPct, pctDelta } from "@/lib/format";
import { Delta, Kicker, ProjectLogo } from "@/components/ui";
import { GscChart, PositionsChart, TrafficChart } from "@/components/charts";

function ReportStat({
  label,
  value,
  sub,
  delta,
  deltaInvertGood,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number | null;
  deltaInvertGood?: boolean;
}) {
  return (
    <div className="border-t-2 border-ink pt-2">
      <div className="text-[10px] uppercase tracking-[0.16em] text-mute">{label}</div>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-display tnum mt-1 text-3xl font-medium">{value}</span>
        {delta !== undefined && <Delta value={delta} invertGood={deltaInvertGood} />}
      </div>
      {sub && <div className="tnum mt-0.5 text-xs text-ink-2">{sub}</div>}
    </div>
  );
}

export function Report({
  project,
  statsBase,
  publicMode = false,
}: {
  project: ProjectDTO;
  statsBase?: string;
  publicMode?: boolean;
}) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<DashboardData | null>(null);
  const base = statsBase ?? `/api/projects/${project.id}/stats`;

  function selectDays(range: number) {
    setData(null);
    setDays(range);
  }

  useEffect(() => {
    fetch(`${base}?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [base, days]);

  if (!data) {
    return <div className="py-32 text-center text-mute">Готовим отчёт…</div>;
  }

  const m = data.metrika;
  const g = data.gsc;
  const w = data.webmaster;
  const pos = data.positions;
  const mp = m.prevTotals;
  const gp = g.prevTotals;
  const brandShare = m.totals.organicVisits
    ? Math.round((m.totals.brandVisits / m.totals.organicVisits) * 1000) / 10
    : 0;

  return (
    <main className="mx-auto max-w-[820px] px-6 pb-24">
      {/* Панель управления — не печатается */}
      <div className="no-print mt-6 flex items-center justify-between gap-4 border border-line bg-card px-4 py-3 text-sm">
        {publicMode ? (
          <span className="text-mute">Отчёт · {project.name}</span>
        ) : (
          <Link href={`/p/${project.id}`} className="text-ink-2 hover:text-ink">
            ← К дашборду
          </Link>
        )}
        <div className="flex items-center gap-3">
          <div className="flex border border-line bg-white">
            {[7, 30, 90].map((r) => (
              <button
                key={r}
                onClick={() => selectDays(r)}
                className={`cursor-pointer px-3 py-1 ${days === r ? "bg-night text-paper" : "text-ink-2"}`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.print()}
            className="cursor-pointer bg-pine px-4 py-1.5 font-medium text-paper hover:opacity-90"
          >
            Печать / PDF
          </button>
        </div>
      </div>

      {/* Лист отчёта */}
      <div className="mt-6 border border-line bg-white p-10 print:mt-0 print:border-0 print:p-0">
        {/* Шапка */}
        <div className="flex items-start justify-between gap-6 border-b-2 border-ink pb-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-mute">SEO-отчёт</div>
            <h1 className="font-display mt-2 text-4xl font-semibold leading-tight">{project.name}</h1>
            <div className="mt-1 text-sm text-ink-2">
              {project.domain} · {fmtDate(data.from)} — {fmtDate(data.to)}
            </div>
          </div>
          <ProjectLogo logo={project.logo} name={project.name} size={72} />
        </div>

        {/* Ключевые показатели */}
        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
          <ReportStat label="Визиты" value={fmtInt(m.totals.visits)} delta={pctDelta(m.totals.visits, mp?.visits)} />
          <ReportStat label="Органика" value={fmtInt(m.totals.organicVisits)} sub={`${fmtPct(m.totals.organicShare)} трафика`} delta={pctDelta(m.totals.organicVisits, mp?.organicVisits)} />
          <ReportStat label="Бренд" value={fmtInt(m.totals.brandVisits)} sub={`${fmtPct(brandShare)} органики`} delta={pctDelta(m.totals.brandVisits, mp?.brandVisits)} />
          <ReportStat label="Отказы" value={fmtPct(m.totals.bounceRate)} delta={pctDelta(m.totals.bounceRate, mp?.bounceRate)} deltaInvertGood />
        </div>
        <div className="mt-2 text-[10px] uppercase tracking-[0.16em] text-mute">
          ▲▼ — изменение к предыдущим {data.days} дням
        </div>

        {/* Динамика */}
        <section className="mt-10">
          <Kicker className="mb-3">Динамика трафика · Яндекс Метрика</Kicker>
          <TrafficChart data={m.timeline} height={220} />
        </section>

        {/* Источники + страницы */}
        <section className="mt-10 grid gap-8 sm:grid-cols-2">
          <div>
            <Kicker className="mb-3">Источники</Kicker>
            {m.sources.slice(0, 6).map((s) => (
              <div key={s.id || s.name} className="flex items-baseline justify-between border-b border-line-soft py-1.5 text-sm">
                <span className="truncate">{s.name}</span>
                <span className="tnum shrink-0 text-ink-2">
                  {fmtInt(s.visits)} <span className="ml-1 text-mute">{fmtPct(s.share)}</span>
                </span>
              </div>
            ))}
          </div>
          <div>
            <Kicker className="mb-3">Страницы входа из поиска</Kicker>
            {m.landingPages.slice(0, 6).map((p) => (
              <div key={p.url} className="flex items-baseline justify-between gap-3 border-b border-line-soft py-1.5 text-sm">
                <span className="truncate" title={p.url}>{p.url}</span>
                <span className="tnum shrink-0 text-ink-2">{fmtInt(p.visits)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Цели */}
        {m.goals.length > 0 && (
          <section className="mt-10">
            <Kicker className="mb-3">Цели</Kicker>
            <div className="grid gap-x-8 sm:grid-cols-2">
              {m.goals.slice(0, 6).map((goal) => (
                <div key={goal.id} className="flex items-baseline justify-between border-b border-line-soft py-1.5 text-sm">
                  <span className="truncate">{goal.name}</span>
                  <span className="tnum shrink-0 text-ink-2">
                    {fmtInt(goal.reaches)} <span className="ml-1 text-mute">CR {fmtPct(goal.conversion)}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* GSC */}
        <section className="mt-10 break-inside-avoid">
          <Kicker className="mb-3">Google Search Console</Kicker>
          <div className="mb-4 grid grid-cols-4 gap-6">
            <ReportStat label="Клики" value={fmtInt(g.totals.clicks)} delta={pctDelta(g.totals.clicks, gp?.clicks)} />
            <ReportStat label="Показы" value={fmtInt(g.totals.impressions)} delta={pctDelta(g.totals.impressions, gp?.impressions)} />
            <ReportStat label="CTR" value={fmtPct(g.totals.ctr)} delta={pctDelta(g.totals.ctr, gp?.ctr)} />
            <ReportStat label="Позиция" value={String(g.totals.position)} delta={pctDelta(g.totals.position, gp?.position)} deltaInvertGood />
          </div>
          <GscChart data={g.timeline} height={200} />
        </section>

        {/* Вебмастер */}
        <section className="mt-10 break-inside-avoid">
          <Kicker className="mb-3">Яндекс Вебмастер</Kicker>
          <div className="grid grid-cols-3 gap-6">
            <ReportStat label="ИКС" value={fmtInt(w.sqi)} />
            <ReportStat label="Страниц в поиске" value={fmtInt(w.searchablePages)} />
            <ReportStat label="Исключено" value={fmtInt(w.excludedPages)} />
          </div>
        </section>

        {/* Позиции */}
        {pos && (pos.timeline.length > 0 || pos.keywords > 0) && (
          <section className="mt-10 break-inside-avoid">
            <Kicker className="mb-3">
              Видимость в поиске
              {pos.provider === "topvisor" ? " · Топвизор" : pos.provider === "keysso" ? " · Keys.so" : ""}
            </Kicker>
            <div className="mb-4 grid grid-cols-4 gap-6">
              <ReportStat label="Запросов" value={fmtInt(pos.keywords)} />
              <ReportStat label="Топ-3" value={fmtInt(pos.top3)} />
              <ReportStat label="Топ-10" value={fmtInt(pos.top10)} />
              <ReportStat label="Ср. позиция" value={pos.avgPosition ? String(pos.avgPosition) : "—"} />
            </div>
            {pos.timeline.length > 0 && <PositionsChart data={pos.timeline} height={190} />}
          </section>
        )}

        {/* Подвал */}
        <div className="mt-12 flex items-baseline justify-between border-t border-line pt-4 text-xs text-mute">
          <span>
            Сформировано в «Маяк» · {fmtDate(new Date().toISOString().slice(0, 10))}
          </span>
          <span>
            {!m.live || !g.live || !w.live ? "Часть данных — демонстрационная" : "Данные из API"}
          </span>
        </div>
      </div>
    </main>
  );
}
