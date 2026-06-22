import type { WmBlock, WmQueryRow } from "./types";

const API = "https://api.webmaster.yandex.net/v4";

async function wGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `OAuth ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Вебмастер ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json() as Promise<T>;
}

export async function fetchWebmaster(opts: {
  token: string;
  hostId: string;
  domain: string;
}): Promise<WmBlock> {
  const { user_id } = await wGet<{ user_id: number }>("/user", opts.token);

  let hostId = opts.hostId.trim();
  if (!hostId) {
    const { hosts } = await wGet<{ hosts: { host_id: string; ascii_host_url: string; verified: boolean }[] }>(
      `/user/${user_id}/hosts`,
      opts.token
    );
    const stem = opts.domain.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
    const match = hosts.find((h) => h.verified && h.ascii_host_url.includes(stem)) ?? hosts.find((h) => h.verified);
    if (!match) throw new Error("Вебмастер: не найден подтверждённый хост для этого домена");
    hostId = match.host_id;
  }

  const summary = await wGet<{ sqi: number; searchable_pages_count: number; excluded_pages_count: number }>(
    `/user/${user_id}/hosts/${hostId}/summary`,
    opts.token
  );

  // популярные запросы доступны за ограниченное окно — берём последние 14 дней
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 14);
  const qs = new URLSearchParams({
    order_by: "TOTAL_CLICKS",
    date_from: from.toISOString().slice(0, 10),
    date_to: to.toISOString().slice(0, 10),
  });
  for (const ind of ["TOTAL_SHOWS", "TOTAL_CLICKS", "AVG_SHOW_POSITION"]) {
    qs.append("query_indicator", ind);
  }

  let queries: WmQueryRow[] = [];
  try {
    const resp = await wGet<{
      queries: { query_text: string; indicators: Record<string, number> }[];
    }>(`/user/${user_id}/hosts/${hostId}/search-queries/popular/?${qs.toString()}`, opts.token);
    queries = (resp.queries ?? []).slice(0, 10).map((q) => ({
      query: q.query_text,
      shows: Math.round(q.indicators.TOTAL_SHOWS ?? 0),
      clicks: Math.round(q.indicators.TOTAL_CLICKS ?? 0),
      position: Math.round((q.indicators.AVG_SHOW_POSITION ?? 0) * 10) / 10,
    }));
  } catch {
    queries = [];
  }

  return {
    live: true,
    sqi: summary.sqi ?? 0,
    searchablePages: summary.searchable_pages_count ?? 0,
    excludedPages: summary.excluded_pages_count ?? 0,
    queries,
  };
}
