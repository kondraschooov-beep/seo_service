import { updateProject, type ProjectRow } from "./db";
import { dateRange, demoGsc, demoMetrika, demoPositions, demoWebmaster, domainStem } from "./demo";
import { fetchGsc } from "./gsc";
import { fetchMetrika } from "./metrika";
import { fetchKeysso, fetchTopvisor } from "./positions";
import { fetchWebmaster } from "./webmaster";
import type { DashboardData, GscBlock, MetrikaBlock, PositionsBlock, WmBlock } from "./types";

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function shiftDays(iso: string, delta: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export async function assembleDashboard(project: ProjectRow, days: number): Promise<DashboardData> {
  const { from, to } = dateRange(days);
  // предыдущий период той же длины, впритык к текущему
  const prevDate2 = shiftDays(from, -1);
  const prevDate1 = shiftDays(from, -days);
  const seed = `${project.id}:${project.name}:${project.domain}`;
  const brand = domainStem(project.domain || project.name);
  const brandKeywords = project.brand_keywords
    ? project.brand_keywords.split(",").map((s) => s.trim()).filter(Boolean)
    : [brand];

  const metrikaP: Promise<MetrikaBlock> =
    project.metrika_counter_id && project.metrika_token
      ? fetchMetrika({
          counterId: project.metrika_counter_id,
          token: project.metrika_token,
          brandKeywords,
          date1: from,
          date2: to,
          prevDate1,
          prevDate2,
        }).catch((e) => ({ ...demoMetrika(seed, days), error: errMsg(e) }))
      : Promise.resolve(demoMetrika(seed, days));

  const gscP: Promise<GscBlock> =
    project.gsc_site_url && project.gsc_credentials
      ? fetchGsc({
          siteUrl: project.gsc_site_url,
          credentials: project.gsc_credentials,
          date1: from,
          date2: to,
          prevDate1,
          prevDate2,
          persist: (credentials) =>
            updateProject(project.id, project.user_id, { gscCredentials: credentials }),
        }).catch((e) => ({ ...demoGsc(seed, days, brand), error: errMsg(e) }))
      : Promise.resolve(demoGsc(seed, days, brand));

  const wmP: Promise<WmBlock> = project.wm_token
    ? fetchWebmaster({
        token: project.wm_token,
        hostId: project.wm_host_id,
        domain: project.domain,
      }).catch((e) => ({ ...demoWebmaster(seed, brand), error: errMsg(e) }))
    : Promise.resolve(demoWebmaster(seed, brand));

  let positionsP: Promise<PositionsBlock>;
  if (project.tv_token && project.tv_user_id && project.tv_project_id) {
    positionsP = fetchTopvisor({
      token: project.tv_token,
      userId: project.tv_user_id,
      projectId: project.tv_project_id,
      regionIndex: project.tv_region_index,
      date1: from,
      date2: to,
    }).catch((e) => ({ ...demoPositions(seed, days), error: errMsg(e) }));
  } else if (project.keysso_token) {
    positionsP = fetchKeysso({ token: project.keysso_token, domain: project.domain }).catch(
      (e) => ({ ...demoPositions(seed, days), error: errMsg(e) })
    );
  } else {
    positionsP = Promise.resolve(demoPositions(seed, days));
  }

  const [metrika, gsc, webmaster, positions] = await Promise.all([metrikaP, gscP, wmP, positionsP]);

  return { from, to, days, metrika, gsc, webmaster, positions };
}
