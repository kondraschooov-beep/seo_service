import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getProject, updateProject } from "@/lib/db";
import { getGscAccessToken } from "@/lib/gsc";
import {
  googleConfigured,
  listGscSites,
  listMetrikaCounters,
  listWebmasterHosts,
  yandexConfigured,
  type CounterOption,
  type HostOption,
  type SiteOption,
} from "@/lib/oauth";

export type IntegrationOptions = {
  env: { yandex: boolean; google: boolean };
  yandex: { connected: boolean; counters: CounterOption[]; hosts: HostOption[]; error?: string };
  google: { connected: boolean; sites: SiteOption[]; error?: string };
};

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  const { id } = await ctx.params;
  const project = getProject(Number(id), uid);
  if (!project) return NextResponse.json({ error: "Проект не найден" }, { status: 404 });

  const result: IntegrationOptions = {
    env: { yandex: yandexConfigured(), google: googleConfigured() },
    yandex: { connected: Boolean(project.metrika_token || project.wm_token), counters: [], hosts: [] },
    google: { connected: Boolean(project.gsc_credentials), sites: [] },
  };

  const yaToken = project.metrika_token || project.wm_token;
  if (yaToken) {
    const [counters, hosts] = await Promise.allSettled([
      listMetrikaCounters(yaToken),
      listWebmasterHosts(yaToken),
    ]);
    if (counters.status === "fulfilled") result.yandex.counters = counters.value;
    else result.yandex.error = counters.reason instanceof Error ? counters.reason.message : String(counters.reason);
    if (hosts.status === "fulfilled") result.yandex.hosts = hosts.value;
    else result.yandex.error ??= hosts.reason instanceof Error ? hosts.reason.message : String(hosts.reason);
  }

  if (project.gsc_credentials) {
    try {
      const token = await getGscAccessToken(project.gsc_credentials, (credentials) =>
        updateProject(project.id, uid, { gscCredentials: credentials })
      );
      result.google.sites = await listGscSites(token);
    } catch (e) {
      result.google.error = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json(result);
}
