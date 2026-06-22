import { JWT } from "google-auth-library";
import { googleRefresh } from "./oauth";
import type { GscBlock, GscPoint, QueryRow } from "./types";

type GscApiRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

// вызывается, когда access token обновлён по refresh token — чтобы сохранить его в базе
export type PersistCredentials = (credentials: string) => void;

export async function getGscAccessToken(
  credentials: string,
  persist?: PersistCredentials
): Promise<string> {
  const trimmed = credentials.trim();
  if (trimmed.startsWith("{")) {
    const obj = JSON.parse(trimmed) as {
      type?: string;
      client_email?: string;
      private_key?: string;
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
    };
    if (obj.type === "service_account") {
      // сайт должен быть расшарен на client_email в GSC
      const client = new JWT({
        email: obj.client_email,
        key: obj.private_key,
        scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
      });
      const { token } = await client.getAccessToken();
      if (!token) throw new Error("GSC: не удалось получить access token по сервисному аккаунту");
      return token;
    }
    if (obj.type === "oauth") {
      // токен, полученный через «Войти через Google»
      if (obj.expires_at && Date.now() < obj.expires_at - 60_000 && obj.access_token) {
        return obj.access_token;
      }
      if (!obj.refresh_token) {
        if (obj.access_token) return obj.access_token;
        throw new Error("GSC: токен истёк, переподключите аккаунт Google");
      }
      const fresh = await googleRefresh(obj.refresh_token);
      persist?.(
        JSON.stringify({
          ...obj,
          access_token: fresh.access_token,
          expires_at: Date.now() + fresh.expires_in * 1000,
        })
      );
      return fresh.access_token;
    }
    throw new Error("GSC: не распознан формат данных доступа");
  }
  return trimmed; // готовый OAuth access token
}

export async function fetchGsc(opts: {
  siteUrl: string;
  credentials: string;
  date1: string;
  date2: string;
  prevDate1?: string;
  prevDate2?: string;
  persist?: PersistCredentials;
}): Promise<GscBlock> {
  const token = await getGscAccessToken(opts.credentials, opts.persist);
  // данные GSC отстают примерно на 2 дня
  const lag = new Date();
  lag.setDate(lag.getDate() - 2);
  const lagIso = lag.toISOString().slice(0, 10);
  const endDate = opts.date2 < lagIso ? opts.date2 : lagIso;

  const query = async (body: Record<string, unknown>): Promise<GscApiRow[]> => {
    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(opts.siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: opts.date1, endDate, ...body }),
        cache: "no-store",
      }
    );
    if (!res.ok) throw new Error(`GSC ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const json = (await res.json()) as { rows?: GscApiRow[] };
    return json.rows ?? [];
  };

  const prevP: Promise<GscApiRow[] | null> =
    opts.prevDate1 && opts.prevDate2
      ? query({ startDate: opts.prevDate1, endDate: opts.prevDate2, rowLimit: 1 }).catch(() => null)
      : Promise.resolve(null);

  const [byDate, byQuery, byPage, prevRows] = await Promise.all([
    query({ dimensions: ["date"], rowLimit: 1000 }),
    query({ dimensions: ["query"], rowLimit: 10 }),
    query({ dimensions: ["page"], rowLimit: 10 }),
    prevP,
  ]);

  const timeline: GscPoint[] = byDate.map((r) => ({
    date: r.keys[0],
    clicks: Math.round(r.clicks),
    impressions: Math.round(r.impressions),
    ctr: Math.round(r.ctr * 1000) / 10,
    position: Math.round(r.position * 10) / 10,
  }));

  const clicks = timeline.reduce((s, p) => s + p.clicks, 0);
  const impressions = timeline.reduce((s, p) => s + p.impressions, 0);
  const position = timeline.length
    ? Math.round((timeline.reduce((s, p) => s + p.position, 0) / timeline.length) * 10) / 10
    : 0;

  const queries: QueryRow[] = byQuery.map((r) => ({
    query: r.keys[0],
    clicks: Math.round(r.clicks),
    impressions: Math.round(r.impressions),
    ctr: Math.round(r.ctr * 1000) / 10,
    position: Math.round(r.position * 10) / 10,
  }));

  const pages = byPage.map((r) => ({
    url: r.keys[0].replace(/^https?:\/\/[^/]+/, "") || "/",
    clicks: Math.round(r.clicks),
    impressions: Math.round(r.impressions),
  }));

  const prev = prevRows?.[0];

  return {
    live: true,
    totals: {
      clicks,
      impressions,
      ctr: impressions ? Math.round((clicks / impressions) * 1000) / 10 : 0,
      position,
    },
    prevTotals: prev
      ? {
          clicks: Math.round(prev.clicks),
          impressions: Math.round(prev.impressions),
          ctr: Math.round(prev.ctr * 1000) / 10,
          position: Math.round(prev.position * 10) / 10,
        }
      : undefined,
    timeline,
    queries,
    pages,
  };
}
