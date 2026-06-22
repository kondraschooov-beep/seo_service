"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DashboardData, ProjectDTO } from "@/lib/types";
import { fmtDate, fmtInt, fmtPct, pctDelta } from "@/lib/format";
import { Card, Kicker, ProjectLogo, SectionHead, SourceBadge, Stat } from "@/components/ui";
import { GscChart, PositionsChart, TrafficChart } from "@/components/charts";

const RANGES = [7, 30, 90] as const;

export function Dashboard({ project }: { project: ProjectDTO }) {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  function selectDays(range: number) {
    setLoading(true);
    setData(null);
    setDays(range);
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/projects/${project.id}/stats?days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [project.id, days]);

  const m = data?.metrika;
  const g = data?.gsc;
  const w = data?.webmaster;
  const pos = data?.positions;
  const errors = [m?.error, g?.error, w?.error, pos?.error].filter(Boolean) as string[];
  const mp = m?.prevTotals;
  const gp = g?.prevTotals;

  return (
    <main className="mx-auto max-w-6xl px-6 pb-24">
      {/* Шапка проекта */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/80 pt-10 pb-4">
        <div className="flex items-center gap-4">
          <ProjectLogo logo={project.logo} name={project.name} size={56} />
          <div>
            <h1 className="font-display text-4xl font-medium leading-none">{project.name}</h1>
            <div className="mt-1.5 text-sm text-ink-2">{project.domain || "домен не указан"}</div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex border border-line bg-card text-sm">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => selectDays(r)}
                className={`cursor-pointer px-3.5 py-1.5 ${
                  days === r ? "bg-night text-paper" : "text-ink-2 hover:text-ink"
                }`}
              >
                {r} дн.
              </button>
            ))}
          </div>
          <Link href={`/p/${project.id}/report`} className="text-sm text-pine underline underline-offset-4 hover:opacity-80">
            Отчёт
          </Link>
          <Link href={`/p/${project.id}/settings`} className="text-sm text-ink-2 underline underline-offset-4 hover:text-ink">
            Настройки
          </Link>
        </div>
      </div>

      {/* Статус источников */}
      {data && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SourceBadge live={data.metrika.live} label="Яндекс Метрика" />
          <SourceBadge live={data.gsc.live} label="Google Search Console" />
          <SourceBadge live={data.webmaster.live} label="Яндекс Вебмастер" />
          <SourceBadge live={data.positions.live} label="Позиции" />
          <span className="ml-auto text-xs text-mute">
            {fmtDate(data.from)} — {fmtDate(data.to)} · ▲▼ к прошлым {data.days} дн.
          </span>
        </div>
      )}
      {errors.length > 0 && (
        <div className="mt-2 text-xs leading-relaxed text-rust">
          {errors.map((e, i) => (
            <div key={i}>⚠ {e}</div>
          ))}
          <div className="text-mute">Пока показаны демо-данные — проверьте токены в настройках.</div>
        </div>
      )}

      {loading || !data || !m || !g || !w ? (
        <div className="py-32 text-center text-mute">Собираем данные…</div>
      ) : (
        <>
          {/* KPI */}
          <div className="mt-6 grid grid-cols-2 gap-y-2 border-y border-line sm:grid-cols-5 sm:divide-x sm:divide-line">
            <Stat
              label="Визиты"
              value={fmtInt(m.totals.visits)}
              sub={`${fmtInt(m.totals.pageviews)} просмотров`}
              delta={pctDelta(m.totals.visits, mp?.visits)}
            />
            <Stat
              label="Посетители"
              value={fmtInt(m.totals.users)}
              delta={pctDelta(m.totals.users, mp?.users)}
            />
            <Stat
              label="Органика"
              value={fmtInt(m.totals.organicVisits)}
              sub={`${fmtPct(m.totals.organicShare)} всего трафика`}
              accent="pine"
              delta={pctDelta(m.totals.organicVisits, mp?.organicVisits)}
            />
            <Stat
              label="Брендовый трафик"
              value={fmtInt(m.totals.brandVisits)}
              sub={
                m.totals.organicVisits
                  ? `${fmtPct(Math.round((m.totals.brandVisits / m.totals.organicVisits) * 1000) / 10)} органики`
                  : undefined
              }
              accent="honey"
              delta={pctDelta(m.totals.brandVisits, mp?.brandVisits)}
            />
            <Stat
              label="Отказы"
              value={fmtPct(m.totals.bounceRate)}
              delta={pctDelta(m.totals.bounceRate, mp?.bounceRate)}
              deltaInvertGood
            />
          </div>

          {/* Динамика */}
          <section className="mt-10">
            <SectionHead
              kicker="Яндекс Метрика"
              title="Динамика трафика"
              right={
                <div className="flex gap-4 text-xs text-ink-2">
                  <span><span className="mr-1.5 inline-block h-2 w-2 bg-ink" />Визиты</span>
                  <span><span className="mr-1.5 inline-block h-2 w-2 bg-pine" />Органика</span>
                </div>
              }
            />
            <Card className="p-4">
              <TrafficChart data={m.timeline} />
            </Card>
          </section>

          {/* Источники + бренд */}
          <section className="mt-10 grid gap-8 lg:grid-cols-2">
            <div>
              <SectionHead kicker="Откуда приходят" title="Источники трафика" />
              <Card className="px-5 py-3">
                {m.sources.map((s) => (
                  <div key={s.id || s.name} className="border-b border-line-soft py-2.5 last:border-0">
                    <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate">{s.name}</span>
                      <span className="tnum shrink-0 text-ink-2">
                        {fmtInt(s.visits)} <span className="ml-1 text-mute">{fmtPct(s.share)}</span>
                      </span>
                    </div>
                    <div className="h-[5px] w-full bg-line-soft">
                      <div
                        className="h-full"
                        style={{
                          width: `${Math.min(s.share, 100)}%`,
                          background: s.id === "organic" ? "var(--color-pine)" : "var(--color-ink)",
                          opacity: s.id === "organic" ? 1 : 0.55,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </Card>
            </div>

            <div className="flex flex-col gap-8">
              <div>
                <SectionHead kicker="Структура органики" title="Бренд / небренд" />
                <Card className="p-5">
                  <div className="flex h-7 w-full overflow-hidden">
                    <div
                      className="bg-honey"
                      style={{
                        width: `${m.totals.organicVisits ? (m.totals.brandVisits / m.totals.organicVisits) * 100 : 0}%`,
                      }}
                    />
                    <div className="flex-1 bg-pine" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <Kicker>Бренд</Kicker>
                      <div className="font-display tnum mt-1 text-2xl font-medium text-honey">
                        {fmtInt(m.totals.brandVisits)}
                      </div>
                      <div className="text-xs text-mute">запросы с упоминанием бренда</div>
                    </div>
                    <div>
                      <Kicker>Небренд</Kicker>
                      <div className="font-display tnum mt-1 text-2xl font-medium text-pine">
                        {fmtInt(m.totals.nonBrandVisits)}
                      </div>
                      <div className="text-xs text-mute">коммерческие и информационные</div>
                    </div>
                  </div>
                </Card>
              </div>

              <div>
                <SectionHead kicker="Органика по системам" title="Поисковые системы" />
                <Card className="px-5 py-2">
                  {m.searchEngines.map((e) => {
                    const maxV = m.searchEngines[0]?.visits || 1;
                    return (
                      <div key={e.name} className="flex items-center gap-3 border-b border-line-soft py-2 text-sm last:border-0">
                        <span className="w-20 shrink-0">{e.name}</span>
                        <div className="h-[5px] flex-1 bg-line-soft">
                          <div className="h-full bg-pine" style={{ width: `${(e.visits / maxV) * 100}%` }} />
                        </div>
                        <span className="tnum w-16 shrink-0 text-right text-ink-2">{fmtInt(e.visits)}</span>
                      </div>
                    );
                  })}
                </Card>
              </div>
            </div>
          </section>

          {/* Страницы входа + цели */}
          <section className="mt-10 grid gap-8 lg:grid-cols-2">
            <div>
              <SectionHead kicker="Органика" title="Популярные страницы входа" />
              <Card className="px-5 py-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-mute">
                      <th className="py-2 font-medium">Страница</th>
                      <th className="py-2 text-right font-medium">Визиты</th>
                      <th className="py-2 text-right font-medium">Отказы</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.landingPages.map((p) => (
                      <tr key={p.url} className="border-t border-line-soft">
                        <td className="max-w-0 truncate py-2 pr-3" title={p.url}>{p.url}</td>
                        <td className="tnum py-2 text-right">{fmtInt(p.visits)}</td>
                        <td className="tnum py-2 text-right text-ink-2">{fmtPct(p.bounceRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>

            <div>
              <SectionHead kicker="Конверсии" title="Цели и воронка" />
              <Card className="px-5 py-3">
                {m.goals.length === 0 && (
                  <p className="py-4 text-sm text-mute">
                    В счётчике нет настроенных целей — добавьте их в Метрике.
                  </p>
                )}
                {m.goals.map((goal, i) => {
                  const maxR = m.goals[0]?.reaches || 1;
                  return (
                    <div key={goal.id} className="border-b border-line-soft py-2.5 last:border-0">
                      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate">{goal.name}</span>
                        <span className="tnum shrink-0 text-ink-2">
                          {fmtInt(goal.reaches)}
                          <span className="ml-2 text-mute">CR {fmtPct(goal.conversion)}</span>
                        </span>
                      </div>
                      <div className="h-[5px] w-full bg-line-soft">
                        <div
                          className="h-full"
                          style={{
                            width: `${(goal.reaches / maxR) * 100}%`,
                            background: i === 0 ? "var(--color-pine)" : "var(--color-honey)",
                            opacity: 1 - i * 0.12,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          </section>

          {/* GSC */}
          <section className="mt-12">
            <SectionHead kicker="Google" title="Search Console" />
            <div className="grid grid-cols-2 border-y border-line sm:grid-cols-4 sm:divide-x sm:divide-line">
              <Stat label="Клики" value={fmtInt(g.totals.clicks)} accent="pine" delta={pctDelta(g.totals.clicks, gp?.clicks)} />
              <Stat label="Показы" value={fmtInt(g.totals.impressions)} delta={pctDelta(g.totals.impressions, gp?.impressions)} />
              <Stat label="CTR" value={fmtPct(g.totals.ctr)} delta={pctDelta(g.totals.ctr, gp?.ctr)} />
              <Stat label="Ср. позиция" value={String(g.totals.position)} delta={pctDelta(g.totals.position, gp?.position)} deltaInvertGood />
            </div>
            <Card className="mt-6 p-4">
              <GscChart data={g.timeline} />
            </Card>
            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              <Card className="px-5 py-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-mute">
                      <th className="py-2 font-medium">Запрос</th>
                      <th className="py-2 text-right font-medium">Клики</th>
                      <th className="py-2 text-right font-medium">Показы</th>
                      <th className="py-2 text-right font-medium">Поз.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.queries.map((q) => (
                      <tr key={q.query} className="border-t border-line-soft">
                        <td className="max-w-0 truncate py-2 pr-3" title={q.query}>{q.query}</td>
                        <td className="tnum py-2 text-right">{fmtInt(q.clicks)}</td>
                        <td className="tnum py-2 text-right text-ink-2">{fmtInt(q.impressions)}</td>
                        <td className="tnum py-2 text-right text-ink-2">{q.position}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
              <Card className="px-5 py-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-mute">
                      <th className="py-2 font-medium">Страница</th>
                      <th className="py-2 text-right font-medium">Клики</th>
                      <th className="py-2 text-right font-medium">Показы</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.pages.map((p) => (
                      <tr key={p.url} className="border-t border-line-soft">
                        <td className="max-w-0 truncate py-2 pr-3" title={p.url}>{p.url}</td>
                        <td className="tnum py-2 text-right">{fmtInt(p.clicks)}</td>
                        <td className="tnum py-2 text-right text-ink-2">{fmtInt(p.impressions)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          </section>

          {/* Вебмастер */}
          <section className="mt-12">
            <SectionHead kicker="Яндекс" title="Вебмастер" />
            <div className="grid grid-cols-3 border-y border-line sm:divide-x sm:divide-line">
              <Stat label="ИКС" value={fmtInt(w.sqi)} accent="pine" />
              <Stat label="Страниц в поиске" value={fmtInt(w.searchablePages)} />
              <Stat label="Исключено" value={fmtInt(w.excludedPages)} />
            </div>
            <Card className="mt-6 px-5 py-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-mute">
                    <th className="py-2 font-medium">Популярный запрос · 14 дней</th>
                    <th className="py-2 text-right font-medium">Показы</th>
                    <th className="py-2 text-right font-medium">Клики</th>
                    <th className="py-2 text-right font-medium">Поз.</th>
                  </tr>
                </thead>
                <tbody>
                  {w.queries.map((q) => (
                    <tr key={q.query} className="border-t border-line-soft">
                      <td className="max-w-0 truncate py-2 pr-3" title={q.query}>{q.query}</td>
                      <td className="tnum py-2 text-right">{fmtInt(q.shows)}</td>
                      <td className="tnum py-2 text-right">{fmtInt(q.clicks)}</td>
                      <td className="tnum py-2 text-right text-ink-2">{q.position}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </section>

          {/* Позиции */}
          {pos && (
            <section className="mt-12">
              <SectionHead
                kicker={
                  pos.provider === "topvisor"
                    ? "Топвизор"
                    : pos.provider === "keysso"
                      ? "Keys.so"
                      : "Позиции"
                }
                title="Видимость в поиске"
                right={
                  pos.provider === "demo" ? (
                    <span className="text-xs text-mute">подключите Топвизор или Keys.so в настройках</span>
                  ) : undefined
                }
              />
              <div className="grid grid-cols-2 border-y border-line sm:grid-cols-4 sm:divide-x sm:divide-line">
                <Stat label="Запросов" value={fmtInt(pos.keywords)} />
                <Stat label="В топ-3" value={fmtInt(pos.top3)} accent="pine" />
                <Stat label="В топ-10" value={fmtInt(pos.top10)} accent="pine" />
                <Stat
                  label="Ср. позиция"
                  value={pos.avgPosition ? String(pos.avgPosition) : "—"}
                />
              </div>
              {pos.timeline.length > 0 && (
                <Card className="mt-6 p-4">
                  <div className="mb-2 flex justify-end gap-4 text-xs text-ink-2">
                    <span><span className="mr-1.5 inline-block h-2 w-2 bg-pine" />Доля в топ-10</span>
                    <span><span className="mr-1.5 inline-block h-2 w-2 bg-honey" />Ср. позиция</span>
                  </div>
                  <PositionsChart data={pos.timeline} />
                </Card>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}
