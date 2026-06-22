import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getProject, updateProject } from "@/lib/db";
import { getBaseUrl } from "@/lib/base-url";
import {
  listMetrikaCounters,
  listWebmasterHosts,
  matchCounter,
  matchHost,
  verifyState,
  yandexExchangeCode,
} from "@/lib/oauth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = getBaseUrl(req);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const fail = (pid: number | null, msg: string) =>
    NextResponse.redirect(
      new URL(
        pid
          ? `/p/${pid}/settings?oauth_error=${encodeURIComponent(msg)}`
          : "/projects",
        base
      )
    );

  const st = state ? await verifyState(state) : null;
  if (!st) return fail(null, "");
  const uid = await getUserId();
  if (uid !== st.uid) return fail(st.pid, "Сессия не совпадает — войдите заново");
  const project = getProject(st.pid, st.uid);
  if (!project) return fail(null, "");
  if (!code) return fail(st.pid, url.searchParams.get("error_description") ?? "Яндекс не вернул код");

  try {
    const { access_token } = await yandexExchangeCode(code);
    const patch: Record<string, string> = {
      metrikaToken: access_token,
      wmToken: access_token,
    };
    // автоподбор счётчика и хоста по домену проекта
    try {
      const counters = await listMetrikaCounters(access_token);
      const hit = matchCounter(counters, project.domain);
      if (hit) patch.metrikaCounterId = String(hit.id);
      else if (counters.length === 1) patch.metrikaCounterId = String(counters[0].id);
    } catch { /* выберут в настройках */ }
    try {
      const hosts = await listWebmasterHosts(access_token);
      const hit = matchHost(hosts, project.domain);
      if (hit) patch.wmHostId = hit.hostId;
    } catch { /* подберётся по домену при запросе */ }
    updateProject(project.id, st.uid, patch);
    return NextResponse.redirect(new URL(`/p/${project.id}/settings?connected=yandex`, base));
  } catch (e) {
    return fail(st.pid, e instanceof Error ? e.message : "Ошибка обмена кода");
  }
}
