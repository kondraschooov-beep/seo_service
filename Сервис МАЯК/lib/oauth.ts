import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "searchlight-dev-secret-change-me-in-production"
);

export const yandexConfigured = (): boolean =>
  Boolean(process.env.YANDEX_CLIENT_ID && process.env.YANDEX_CLIENT_SECRET);

export const googleConfigured = (): boolean =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// state-токен защищает callback от CSRF и переносит id проекта через OAuth-редирект
export async function signState(uid: number, projectId: number): Promise<string> {
  return new SignJWT({ uid, pid: projectId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .sign(secret);
}

export async function verifyState(state: string): Promise<{ uid: number; pid: number } | null> {
  try {
    const { payload } = await jwtVerify(state, secret);
    if (typeof payload.uid === "number" && typeof payload.pid === "number") {
      return { uid: payload.uid, pid: payload.pid };
    }
  } catch {
    /* истёк или подделан */
  }
  return null;
}

export function yandexAuthUrl(redirectUri: string, state: string): string {
  const qs = new URLSearchParams({
    response_type: "code",
    client_id: process.env.YANDEX_CLIENT_ID!,
    redirect_uri: redirectUri,
    state,
    force_confirm: "yes",
  });
  return `https://oauth.yandex.ru/authorize?${qs}`;
}

export async function yandexExchangeCode(
  code: string
): Promise<{ access_token: string; expires_in: number; refresh_token?: string }> {
  const res = await fetch("https://oauth.yandex.ru/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.YANDEX_CLIENT_ID!,
      client_secret: process.env.YANDEX_CLIENT_SECRET!,
    }),
  });
  if (!res.ok) throw new Error(`Яндекс OAuth ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

export function googleAuthUrl(redirectUri: string, state: string): string {
  const qs = new URLSearchParams({
    response_type: "code",
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${qs}`;
}

export async function googleExchangeCode(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; expires_in: number; refresh_token?: string }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`Google OAuth ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

export async function googleRefresh(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  });
  if (!res.ok) throw new Error(`Google refresh ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

/* ── Справочники после подключения аккаунта ── */

export type CounterOption = { id: number; name: string; site: string };
export type HostOption = { hostId: string; url: string; verified: boolean };
export type SiteOption = { siteUrl: string; permissionLevel: string };

export async function listMetrikaCounters(token: string): Promise<CounterOption[]> {
  const res = await fetch("https://api-metrika.yandex.net/management/v1/counters?per_page=100", {
    headers: { Authorization: `OAuth ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Метрика ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { counters?: { id: number; name?: string; site?: string }[] };
  return (json.counters ?? []).map((c) => ({ id: c.id, name: c.name ?? "", site: c.site ?? "" }));
}

export async function listWebmasterHosts(token: string): Promise<HostOption[]> {
  const ures = await fetch("https://api.webmaster.yandex.net/v4/user", {
    headers: { Authorization: `OAuth ${token}` },
    cache: "no-store",
  });
  if (!ures.ok) throw new Error(`Вебмастер ${ures.status}: ${(await ures.text()).slice(0, 200)}`);
  const { user_id } = (await ures.json()) as { user_id: number };
  const hres = await fetch(`https://api.webmaster.yandex.net/v4/user/${user_id}/hosts`, {
    headers: { Authorization: `OAuth ${token}` },
    cache: "no-store",
  });
  if (!hres.ok) throw new Error(`Вебмастер ${hres.status}: ${(await hres.text()).slice(0, 200)}`);
  const json = (await hres.json()) as {
    hosts?: { host_id: string; ascii_host_url: string; verified: boolean }[];
  };
  return (json.hosts ?? []).map((h) => ({
    hostId: h.host_id,
    url: h.ascii_host_url,
    verified: h.verified,
  }));
}

export async function listGscSites(accessToken: string): Promise<SiteOption[]> {
  const res = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GSC ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as {
    siteEntry?: { siteUrl: string; permissionLevel: string }[];
  };
  return json.siteEntry ?? [];
}

/* ── Автоподбор по домену проекта ── */

export function stem(domain: string): string {
  return domain.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").toLowerCase();
}

export function matchCounter(counters: CounterOption[], domain: string): CounterOption | undefined {
  const s = stem(domain);
  if (!s) return undefined;
  return counters.find((c) => {
    const cs = stem(c.site);
    return Boolean(cs) && (cs.includes(s) || s.includes(cs));
  });
}

export function matchHost(hosts: HostOption[], domain: string): HostOption | undefined {
  const s = stem(domain);
  if (!s) return undefined;
  return hosts.find((h) => h.verified && h.url.toLowerCase().includes(s));
}

export function matchSite(sites: SiteOption[], domain: string): SiteOption | undefined {
  const s = stem(domain);
  if (!s) return undefined;
  return (
    sites.find((x) => x.siteUrl.toLowerCase() === `sc-domain:${s}`) ??
    sites.find((x) => x.siteUrl.toLowerCase().includes(s))
  );
}
