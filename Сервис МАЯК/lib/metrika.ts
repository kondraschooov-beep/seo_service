import type { EngineRow, GoalRow, MetrikaBlock, PageRow, SourceRow, TimelinePoint } from "./types";

const API = "https://api-metrika.yandex.net";

type StatRow = { dimensions: { name: string; id?: string }[]; metrics: number[] };
type StatResponse = { data: StatRow[]; totals?: number[] };
type ByTimeResponse = {
  time_intervals: [string, string][];
  data: { metrics: number[][] }[];
  totals?: number[][];
};

async function mGet<T>(path: string, token: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API}${path}?${qs}`, {
    headers: { Authorization: `OAuth ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Метрика ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

function brandFilter(keywords: string[]): string {
  const parts = keywords
    .map((k) => k.trim().replace(/'/g, "").toLowerCase())
    .filter(Boolean)
    .map((k) => `ym:s:lastSearchPhrase=*'*${k}*'`);
  return parts.length ? `(${parts.join(" OR ")})` : "";
}

export async function fetchMetrika(opts: {
  counterId: string;
  token: string;
  brandKeywords: string[];
  date1: string;
  date2: string;
  /** предыдущий период той же длины — для дельт */
  prevDate1: string;
  prevDate2: string;
}): Promise<MetrikaBlock> {
  const { counterId, token, brandKeywords, date1, date2, prevDate1, prevDate2 } = opts;
  const common = { ids: counterId, date1, date2, accuracy: "full", lang: "ru" };
  const commonPrev = { ids: counterId, date1: prevDate1, date2: prevDate2, accuracy: "full", lang: "ru" };

  const [byTime, organicByTime, totalsResp, sourcesResp, pagesResp, enginesResp, prevTotalsResp, prevOrganicResp] = await Promise.all([
    mGet<ByTimeResponse>("/stat/v1/data/bytime", token, {
      ...common,
      metrics: "ym:s:visits,ym:s:users",
      group: "day",
    }),
    mGet<ByTimeResponse>("/stat/v1/data/bytime", token, {
      ...common,
      metrics: "ym:s:visits",
      group: "day",
      filters: "ym:s:lastTrafficSource=='organic'",
    }),
    mGet<StatResponse>("/stat/v1/data", token, {
      ...common,
      metrics: "ym:s:visits,ym:s:users,ym:s:pageviews,ym:s:bounceRate",
    }),
    mGet<StatResponse>("/stat/v1/data", token, {
      ...common,
      metrics: "ym:s:visits",
      dimensions: "ym:s:lastTrafficSource",
      sort: "-ym:s:visits",
      limit: "10",
    }),
    mGet<StatResponse>("/stat/v1/data", token, {
      ...common,
      metrics: "ym:s:visits,ym:s:bounceRate",
      dimensions: "ym:s:startURLPathFull",
      filters: "ym:s:lastTrafficSource=='organic'",
      sort: "-ym:s:visits",
      limit: "10",
    }),
    mGet<StatResponse>("/stat/v1/data", token, {
      ...common,
      metrics: "ym:s:visits",
      dimensions: "ym:s:lastSearchEngineRoot",
      filters: "ym:s:lastTrafficSource=='organic'",
      sort: "-ym:s:visits",
      limit: "6",
    }),
    mGet<StatResponse>("/stat/v1/data", token, {
      ...commonPrev,
      metrics: "ym:s:visits,ym:s:users,ym:s:pageviews,ym:s:bounceRate",
    }).catch(() => null),
    mGet<StatResponse>("/stat/v1/data", token, {
      ...commonPrev,
      metrics: "ym:s:visits",
      filters: "ym:s:lastTrafficSource=='organic'",
    }).catch(() => null),
  ]);

  const intervals = byTime.time_intervals.map(([d]) => d);
  const visitsArr = byTime.data[0]?.metrics[0] ?? [];
  const usersArr = byTime.data[0]?.metrics[1] ?? [];
  const organicArr = organicByTime.data[0]?.metrics[0] ?? [];
  const timeline: TimelinePoint[] = intervals.map((date, i) => ({
    date,
    visits: Math.round(visitsArr[i] ?? 0),
    users: Math.round(usersArr[i] ?? 0),
    organic: Math.round(organicArr[i] ?? 0),
  }));

  const t = totalsResp.totals ?? totalsResp.data[0]?.metrics ?? [0, 0, 0, 0];
  const visits = Math.round(t[0] ?? 0);
  const organicVisits = timeline.reduce((s, p) => s + p.organic, 0);

  const sources: SourceRow[] = sourcesResp.data.map((row) => ({
    id: row.dimensions[0]?.id ?? "",
    name: row.dimensions[0]?.name ?? "—",
    visits: Math.round(row.metrics[0]),
    share: visits ? Math.round((row.metrics[0] / visits) * 1000) / 10 : 0,
  }));

  const landingPages: PageRow[] = pagesResp.data.map((row) => ({
    url: row.dimensions[0]?.name ?? "—",
    visits: Math.round(row.metrics[0]),
    bounceRate: Math.round((row.metrics[1] ?? 0) * 10) / 10,
  }));

  const searchEngines: EngineRow[] = enginesResp.data.map((row) => ({
    name: row.dimensions[0]?.name ?? "—",
    visits: Math.round(row.metrics[0]),
  }));

  // Брендовый трафик: органика, где поисковая фраза содержит брендовые слова
  let brandVisits = 0;
  let prevBrandVisits = 0;
  const bf = brandFilter(brandKeywords);
  if (bf) {
    try {
      const filters = `ym:s:lastTrafficSource=='organic' AND ${bf}`;
      const [brandResp, prevBrandResp] = await Promise.all([
        mGet<StatResponse>("/stat/v1/data", token, { ...common, metrics: "ym:s:visits", filters }),
        mGet<StatResponse>("/stat/v1/data", token, { ...commonPrev, metrics: "ym:s:visits", filters }).catch(() => null),
      ]);
      brandVisits = Math.round(brandResp.totals?.[0] ?? 0);
      prevBrandVisits = Math.round(prevBrandResp?.totals?.[0] ?? 0);
    } catch {
      brandVisits = 0;
    }
  }

  // Цели: список из management API + достижения одним запросом
  let goals: GoalRow[] = [];
  try {
    const goalsList = await mGet<{ goals: { id: number; name: string }[] }>(
      `/management/v1/counter/${counterId}/goals`,
      token,
      {}
    );
    const top = (goalsList.goals ?? []).slice(0, 8);
    if (top.length) {
      const metrics = top.map((g) => `ym:s:goal${g.id}reaches`).join(",");
      const reachesResp = await mGet<StatResponse>("/stat/v1/data", token, { ...common, metrics });
      const totals = reachesResp.totals ?? [];
      goals = top
        .map((g, i) => {
          const reaches = Math.round(totals[i] ?? 0);
          return {
            id: String(g.id),
            name: g.name,
            reaches,
            conversion: visits ? Math.round((reaches / visits) * 1000) / 10 : 0,
          };
        })
        .sort((a, b) => b.reaches - a.reaches);
    }
  } catch {
    goals = [];
  }

  const pt = prevTotalsResp?.totals ?? prevTotalsResp?.data[0]?.metrics;
  const prevVisits = Math.round(pt?.[0] ?? 0);
  const prevOrganic = Math.round(prevOrganicResp?.totals?.[0] ?? 0);

  return {
    live: true,
    totals: {
      visits,
      users: Math.round(t[1] ?? 0),
      pageviews: Math.round(t[2] ?? 0),
      bounceRate: Math.round((t[3] ?? 0) * 10) / 10,
      organicVisits,
      organicShare: visits ? Math.round((organicVisits / visits) * 1000) / 10 : 0,
      brandVisits,
      nonBrandVisits: Math.max(organicVisits - brandVisits, 0),
    },
    prevTotals: pt
      ? {
          visits: prevVisits,
          users: Math.round(pt[1] ?? 0),
          pageviews: Math.round(pt[2] ?? 0),
          bounceRate: Math.round((pt[3] ?? 0) * 10) / 10,
          organicVisits: prevOrganic,
          organicShare: prevVisits ? Math.round((prevOrganic / prevVisits) * 1000) / 10 : 0,
          brandVisits: prevBrandVisits,
          nonBrandVisits: Math.max(prevOrganic - prevBrandVisits, 0),
        }
      : undefined,
    timeline,
    sources,
    landingPages,
    goals,
    searchEngines,
  };
}
