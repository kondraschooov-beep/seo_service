import type { PositionsBlock, PositionsPoint } from "./types";

/* ── Топвизор ── */

async function tvPost<T>(path: string, token: string, userId: string, body: unknown): Promise<T> {
  const res = await fetch(`https://api.topvisor.com/v2/json/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${token}`,
      "User-Id": userId,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Топвизор ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { result?: T; errors?: { string: string }[] };
  if (json.errors?.length) throw new Error(`Топвизор: ${JSON.stringify(json.errors).slice(0, 200)}`);
  if (json.result === undefined) throw new Error("Топвизор: пустой ответ");
  return json.result;
}

export type TvProjectOption = { id: number; name: string; site: string; regionIndex: string };

export async function listTopvisorProjects(token: string, userId: string): Promise<TvProjectOption[]> {
  const result = await tvPost<
    { id: number; name: string; site: string; searchers?: { regions?: { index: number }[] }[] }[]
  >("get/projects_2/projects", token, userId, {
    show_searchers_and_regions: 1,
    limit: 100,
  });
  return (result ?? []).map((p) => ({
    id: p.id,
    name: p.name || p.site,
    site: p.site,
    regionIndex: String(p.searchers?.[0]?.regions?.[0]?.index ?? ""),
  }));
}

export async function fetchTopvisor(opts: {
  token: string;
  userId: string;
  projectId: string;
  regionIndex: string;
  date1: string;
  date2: string;
}): Promise<PositionsBlock> {
  // если регион не задан — берём первый регион проекта
  let regionIndex = opts.regionIndex.trim();
  if (!regionIndex) {
    const projects = await listTopvisorProjects(opts.token, opts.userId);
    const own = projects.find((p) => String(p.id) === opts.projectId);
    regionIndex = own?.regionIndex ?? "";
    if (!regionIndex) throw new Error("Топвизор: не удалось определить регион проекта");
  }

  const chart = await tvPost<{
    dates?: string[];
    avg?: (number | string)[];
    tops?: { all?: number[]; top3?: number[]; top10?: number[]; top11_30?: number[] };
    visibility?: (number | string)[];
  }>("get/positions_2/summary/chart", opts.token, opts.userId, {
    project_id: Number(opts.projectId),
    region_index: Number(regionIndex),
    date1: opts.date1,
    date2: opts.date2,
    show_avg: 1,
    show_tops: 1,
    show_visibility: 1,
  });

  const dates = chart.dates ?? [];
  const counts = await tvPost<{ result?: number } | number>(
    "get/keywords_2/keywords",
    opts.token,
    opts.userId,
    { project_id: Number(opts.projectId), limit: 0, show_exists_dates: 0, count_only: 1 }
  ).catch(() => 0);
  const keywords =
    typeof counts === "number" ? counts : Number((counts as { result?: number })?.result ?? 0);

  const lastIdx = dates.length - 1;
  const top3 = chart.tops?.top3?.[lastIdx] ?? 0;
  const top10 = (chart.tops?.top10?.[lastIdx] ?? 0) + top3;
  const avgPosition = Number(chart.avg?.[lastIdx] ?? 0);
  const visibility = Number(chart.visibility?.[lastIdx] ?? 0);

  const allCount = chart.tops?.all?.[lastIdx] ?? keywords;
  const timeline: PositionsPoint[] = dates.map((date, i) => {
    const t3 = chart.tops?.top3?.[i] ?? 0;
    const t10 = (chart.tops?.top10?.[i] ?? 0) + t3;
    const all = chart.tops?.all?.[i] ?? allCount ?? 1;
    return {
      date,
      avgPosition: Math.round(Number(chart.avg?.[i] ?? 0) * 10) / 10,
      top10Share: all ? Math.round((t10 / all) * 1000) / 10 : 0,
    };
  });

  return {
    live: true,
    provider: "topvisor",
    keywords: keywords || allCount || 0,
    top3,
    top10,
    avgPosition: Math.round(avgPosition * 10) / 10,
    visibility: Math.round(visibility * 10) / 10,
    timeline,
  };
}

/* ── Keys.so ── */

export async function fetchKeysso(opts: { token: string; domain: string }): Promise<PositionsBlock> {
  const domain = opts.domain.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
  const res = await fetch(
    `https://api.keys.so/report/simple/organic/info?domain=${encodeURIComponent(domain)}&base=msk`,
    { headers: { "X-Keyso-TOKEN": opts.token }, cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Keys.so ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as Record<string, unknown>;
  const num = (k: string) => Number(json[k] ?? 0);
  // имена полей в ответе keys.so: keywords_count / top3 / top10 / visibility (могут отличаться по тарифам)
  const keywords = num("keywords_count") || num("keywords") || num("kwcount");
  const top3 = num("top3") || num("kw_top3");
  const top10 = num("top10") || num("kw_top10");
  const visibility = num("visibility") || num("vis");
  if (!keywords && !top10 && !visibility) {
    throw new Error(`Keys.so: не распознан ответ (${JSON.stringify(json).slice(0, 150)}…)`);
  }
  return {
    live: true,
    provider: "keysso",
    keywords,
    top3,
    top10,
    avgPosition: 0,
    visibility,
    timeline: [],
  };
}
