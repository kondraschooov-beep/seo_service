import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getProject, updateProject } from "@/lib/db";
import { getBaseUrl } from "@/lib/base-url";
import { googleExchangeCode, listGscSites, matchSite, verifyState } from "@/lib/oauth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = getBaseUrl(req);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const fail = (pid: number | null, msg: string) =>
    NextResponse.redirect(
      new URL(
        pid ? `/p/${pid}/settings?oauth_error=${encodeURIComponent(msg)}` : "/projects",
        base
      )
    );

  const st = state ? await verifyState(state) : null;
  if (!st) return fail(null, "");
  const uid = await getUserId();
  if (uid !== st.uid) return fail(st.pid, "Сессия не совпадает — войдите заново");
  const project = getProject(st.pid, st.uid);
  if (!project) return fail(null, "");
  if (!code) return fail(st.pid, url.searchParams.get("error") ?? "Google не вернул код");

  try {
    const tokens = await googleExchangeCode(code, `${base}/api/oauth/google/callback`);
    const credentials = JSON.stringify({
      type: "oauth",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? "",
      expires_at: Date.now() + tokens.expires_in * 1000,
    });
    const patch: Record<string, string> = { gscCredentials: credentials };
    try {
      const sites = await listGscSites(tokens.access_token);
      const hit = matchSite(sites, project.domain);
      if (hit) patch.gscSiteUrl = hit.siteUrl;
      else if (sites.length === 1) patch.gscSiteUrl = sites[0].siteUrl;
    } catch { /* выберут в настройках */ }
    updateProject(project.id, st.uid, patch);
    return NextResponse.redirect(new URL(`/p/${project.id}/settings?connected=google`, url.origin));
  } catch (e) {
    return fail(st.pid, e instanceof Error ? e.message : "Ошибка обмена кода");
  }
}
